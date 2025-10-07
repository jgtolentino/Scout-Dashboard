#!/usr/bin/env python3
# codex_to_kalaw_log_forwarder.py - Log forwarder from Codex v2 to Kalaw storage
#
# This script connects to the Codex v2 SSE log stream, processes logs,
# and forwards them to Kalaw in batches for persistent storage and analysis.
#
# Author: Kalaw Team
# Version: 1.0.1
# Last Updated: 2025-05-17

import json
import os
import sys
import time
import argparse
import hashlib
import requests
import signal
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Union, Tuple

# Default configuration
DEFAULT_CODEX_LOGS_ENDPOINT = "https://api.openai.com/v2/codex/logs/stream"
DEFAULT_KALAW_BUCKET = "skr://codex-logs/"
DEFAULT_LOG_BATCH_SIZE = 100
DEFAULT_LOG_FLUSH_INTERVAL_SEC = 60
DEFAULT_LOG_LEVEL = "info"
DEFAULT_RETENTION_DAYS = 30
DEFAULT_LOG_FORMAT = "jsonl"  # Options: jsonl, json, csv

# Global variables for signal handling
shutdown_requested = False


class CodexLogForwarder:
    """
    Log forwarder from Codex v2 to Kalaw storage
    
    This class connects to Codex v2's SSE log stream, processes the logs,
    and forwards them to Kalaw in batches for persistent storage and analysis.
    """
    
    def __init__(self,
                 codex_logs_endpoint: str,
                 kalaw_bucket: str,
                 batch_size: int = DEFAULT_LOG_BATCH_SIZE,
                 flush_interval_sec: int = DEFAULT_LOG_FLUSH_INTERVAL_SEC,
                 log_level: str = DEFAULT_LOG_LEVEL,
                 retention_days: int = DEFAULT_RETENTION_DAYS,
                 log_format: str = DEFAULT_LOG_FORMAT,
                 slack_alerts: bool = True,
                 audit_mode: bool = False):
        """
        Initialize the log forwarder
        
        Args:
            codex_logs_endpoint: URL for the Codex v2 logs stream
            kalaw_bucket: Destination bucket in Kalaw
            batch_size: Number of logs to batch before sending
            flush_interval_sec: Maximum time between flushes
            log_level: Minimum log level to process
            retention_days: Number of days to retain logs in Kalaw
            log_format: Format for log storage (jsonl, json, csv)
            slack_alerts: Whether to send critical errors to Slack
            audit_mode: Whether to create checksums for audit trail
        """
        self.codex_logs_endpoint = codex_logs_endpoint
        self.kalaw_bucket = kalaw_bucket
        self.batch_size = batch_size
        self.flush_interval_sec = flush_interval_sec
        self.log_level = log_level.lower()
        self.retention_days = retention_days
        self.log_format = log_format.lower()
        self.slack_alerts = slack_alerts
        self.audit_mode = audit_mode
        
        self.logs_buffer = []
        self.last_flush_time = time.time()
        self.connection_retry_count = 0
        self.max_connection_retries = 5
        self.connection_retry_delay = 5  # seconds
        
        self.stats = {
            "logs_processed": 0,
            "logs_filtered": 0,
            "batches_sent": 0,
            "errors": 0,
            "start_time": datetime.now(timezone.utc).isoformat(),
            "connection_retries": 0,
            "checksums": []
        }
        
        # Validate log level
        valid_levels = ["debug", "info", "warning", "error", "critical"]
        if self.log_level not in valid_levels:
            self.log(f"Invalid log level: {self.log_level}. Using 'info' instead.", "warning")
            self.log_level = "info"
        
        # Set up log level filtering
        self.log_level_map = {
            "debug": 0,
            "info": 1,
            "warning": 2,
            "error": 3,
            "critical": 4
        }
        self.min_log_level = self.log_level_map[self.log_level]
        
        # Create output directory in Kalaw bucket if it doesn't exist
        self.ensure_kalaw_bucket_exists()
    
    def log(self, message: str, level: str = "info") -> None:
        """Log messages from the forwarder itself"""
        level_colors = {
            "debug": "\033[36m",    # Cyan
            "info": "\033[32m",     # Green
            "warning": "\033[33m",  # Yellow
            "error": "\033[31m",    # Red
            "critical": "\033[41m"  # Red background
        }
        reset_color = "\033[0m"
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        level_upper = level.upper()
        
        color = level_colors.get(level.lower(), "")
        print(f"{timestamp} {color}[{level_upper}]{reset_color} {message}")
        
        # Also log errors to a file
        if level.lower() in ["error", "critical"]:
            with open("codex_to_kalaw_errors.log", "a") as f:
                f.write(f"{timestamp} [{level_upper}] {message}\n")
    
    def ensure_kalaw_bucket_exists(self) -> None:
        """Ensure that the Kalaw bucket exists or create it"""
        try:
            result = os.popen(f"pulser exec kalaw:check --bucket {self.kalaw_bucket}").read().strip()
            if "not found" in result.lower():
                self.log(f"Kalaw bucket {self.kalaw_bucket} does not exist, creating it...", "info")
                os.system(f"pulser exec kalaw:create-bucket --bucket {self.kalaw_bucket}")
                self.log(f"Created Kalaw bucket {self.kalaw_bucket}", "info")
        except Exception as e:
            self.log(f"Error checking/creating Kalaw bucket: {e}", "error")
    
    def get_openai_token(self) -> str:
        """
        Get OpenAI API token from Pulser vault
        
        Returns:
            str: OpenAI API token
        
        Raises:
            ValueError: If token retrieval fails
        """
        try:
            result = os.popen("pulser vault:get codex/openai_api_key").read().strip()
            if not result:
                raise ValueError("Failed to get OpenAI API key from vault")
            return result
        except Exception as e:
            self.log(f"Error retrieving OpenAI API token: {e}", "error")
            raise

    def get_kalaw_token(self) -> str:
        """
        Get Kalaw API token from Pulser vault
        
        Returns:
            str: Kalaw API token
        
        Raises:
            ValueError: If token retrieval fails
        """
        try:
            result = os.popen("pulser vault:get kalaw/api_token").read().strip()
            if not result:
                raise ValueError("Failed to get Kalaw API token from vault")
            return result
        except Exception as e:
            self.log(f"Error retrieving Kalaw API token: {e}", "error")
            raise

    def connect_to_log_stream(self) -> requests.Response:
        """
        Connect to Codex v2 log stream via SSE
        
        Returns:
            requests.Response: Streaming response object
        
        Raises:
            requests.HTTPError: If connection fails
        """
        try:
            openai_token = self.get_openai_token()
            headers = {
                "Authorization": f"Bearer {openai_token}",
                "Accept": "text/event-stream",
                "X-Codex-Version": "v2",
                "User-Agent": "Codex-Log-Forwarder/1.0.1 (Kalaw)"
            }
            
            self.log(f"Connecting to Codex v2 log stream at {self.codex_logs_endpoint}...", "info")
            response = requests.get(
                self.codex_logs_endpoint,
                headers=headers,
                stream=True,
                timeout=30  # 30 second timeout for initial connection
            )
            response.raise_for_status()
            self.log("Connected to log stream successfully.", "info")
            return response
        except requests.exceptions.RequestException as e:
            self.log(f"Error connecting to Codex log stream: {e}", "error")
            
            # Increment retry counter and check if we should retry
            self.connection_retry_count += 1
            self.stats["connection_retries"] += 1
            
            if self.connection_retry_count > self.max_connection_retries:
                self.log(f"Maximum connection retries ({self.max_connection_retries}) exceeded", "critical")
                
                if self.slack_alerts:
                    self.send_slack_alert(f"Codex log forwarder failed to connect after {self.max_connection_retries} retries")
                
                raise
            
            self.log(f"Retrying connection in {self.connection_retry_delay} seconds (attempt {self.connection_retry_count}/{self.max_connection_retries})", "warning")
            time.sleep(self.connection_retry_delay)
            
            # Exponential backoff for retry delay
            self.connection_retry_delay = min(self.connection_retry_delay * 2, 60)
            
            return self.connect_to_log_stream()

    def process_log_entry(self, log_entry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Process and enrich a log entry
        
        Args:
            log_entry: Raw log entry from Codex v2
            
        Returns:
            Dict[str, Any]: Enriched log entry, or None if filtered out
        """
        # Filter based on log level
        if "level" in log_entry:
            entry_level = log_entry["level"].lower()
            if entry_level in self.log_level_map and self.log_level_map[entry_level] < self.min_log_level:
                self.stats["logs_filtered"] += 1
                return None
        
        # Add timestamp and source metadata
        enriched_entry = log_entry.copy()
        
        # Use existing timestamp if available, otherwise add one
        if "timestamp" not in enriched_entry:
            enriched_entry["timestamp"] = datetime.now(timezone.utc).isoformat()
        
        # Add source and forwarder metadata
        enriched_entry.update({
            "source": "codex_v2",
            "log_forwarder_version": "1.0.1",
            "environment": os.environ.get("PULSER_ENV", "production")
        })
        
        # Add request correlation ID if available
        if "request_id" not in enriched_entry and "correlation_id" in enriched_entry:
            enriched_entry["request_id"] = enriched_entry["correlation_id"]
        
        # Add checksum for audit purposes if in audit mode
        if self.audit_mode:
            entry_str = json.dumps(enriched_entry, sort_keys=True)
            checksum = hashlib.sha256(entry_str.encode()).hexdigest()
            enriched_entry["checksum"] = checksum
        
        return enriched_entry

    def format_logs(self, logs: List[Dict[str, Any]]) -> Tuple[str, str]:
        """
        Format logs according to the configured format
        
        Args:
            logs: List of log entries to format
            
        Returns:
            Tuple[str, str]: A tuple containing (formatted_content, file_extension)
        """
        if self.log_format == "jsonl":
            content = "\n".join(json.dumps(log) for log in logs)
            extension = "jsonl"
        elif self.log_format == "json":
            content = json.dumps(logs, indent=2)
            extension = "json"
        elif self.log_format == "csv":
            if not logs:
                return "", "csv"
                
            # Get all unique keys
            all_keys = set()
            for log in logs:
                all_keys.update(log.keys())
            
            # Sort keys for consistent output
            keys = sorted(all_keys)
            
            # Create CSV header and rows
            header = ",".join(f'"{k}"' for k in keys)
            rows = []
            
            for log in logs:
                row = []
                for key in keys:
                    value = log.get(key, "")
                    if isinstance(value, (dict, list)):
                        value = json.dumps(value).replace('"', '""')
                    elif isinstance(value, str):
                        value = value.replace('"', '""')
                    row.append(f'"{value}"')
                rows.append(",".join(row))
            
            content = header + "\n" + "\n".join(rows)
            extension = "csv"
        else:
            # Default to jsonl
            content = "\n".join(json.dumps(log) for log in logs)
            extension = "jsonl"
        
        return content, extension

    def send_logs_to_kalaw(self) -> bool:
        """
        Send batch of logs to Kalaw
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.logs_buffer:
            return True
        
        log_count = len(self.logs_buffer)
        self.log(f"Preparing to send {log_count} logs to Kalaw", "info")
        
        try:
            # Format logs according to the configured format
            content, extension = self.format_logs(self.logs_buffer)
            
            if not content:
                self.log("No content to send after formatting", "warning")
                return True
            
            # Create a formatted timestamp for the filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            batch_filename = f"codex_logs_{timestamp}.{extension}"
            temp_path = os.path.join("/tmp", batch_filename)
            
            # Write logs to file
            with open(temp_path, "w") as f:
                f.write(content)
            
            # Get file size
            file_size = os.path.getsize(temp_path)
            self.log(f"Created log file {batch_filename} ({file_size} bytes)", "debug")
            
            # Calculate checksum for the whole file if in audit mode
            if self.audit_mode:
                file_checksum = hashlib.sha256(content.encode()).hexdigest()
                self.stats["checksums"].append({
                    "filename": batch_filename,
                    "checksum": file_checksum,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "size_bytes": file_size,
                    "log_count": log_count
                })
                
                # Write checksum to a separate file
                checksum_file = f"{temp_path}.sha256"
                with open(checksum_file, "w") as f:
                    f.write(file_checksum)
            
            # Get Kalaw token
            kalaw_token = self.get_kalaw_token()
            
            # Calculate target path in Kalaw bucket
            # Organize by year/month/day for better partitioning
            year_month_day = datetime.now().strftime("%Y/%m/%d")
            target_path = f"{self.kalaw_bucket}{year_month_day}/"
            
            # Upload to Kalaw
            upload_cmd = f"pulser exec kalaw:upload --file {temp_path} --dest {target_path} --token {kalaw_token}"
            
            # Add checksum file if in audit mode
            if self.audit_mode:
                upload_cmd += f" && pulser exec kalaw:upload --file {checksum_file} --dest {target_path} --token {kalaw_token}"
            
            # Add retention policy
            upload_cmd += f" --retention-days {self.retention_days}"
            
            # Execute upload command
            self.log(f"Uploading logs to {target_path}{batch_filename}", "debug")
            result = os.system(upload_cmd)
            
            if result == 0:
                self.log(f"Successfully uploaded {log_count} logs to {target_path}{batch_filename}", "info")
                self.stats["batches_sent"] += 1
                self.stats["logs_processed"] += log_count
                
                # Clean up temporary files
                os.remove(temp_path)
                
                if self.audit_mode and os.path.exists(checksum_file):
                    os.remove(checksum_file)
                
                return True
            else:
                self.log(f"Failed to upload logs to Kalaw, exit code: {result}", "error")
                self.stats["errors"] += 1
                
                # Try to preserve logs by keeping the temp file
                backup_dir = "/tmp/codex_logs_backup"
                os.makedirs(backup_dir, exist_ok=True)
                backup_path = os.path.join(backup_dir, batch_filename)
                os.rename(temp_path, backup_path)
                
                self.log(f"Logs preserved in: {backup_path}", "info")
                
                if self.slack_alerts:
                    self.send_slack_alert(f"Failed to upload Codex logs to Kalaw. Logs preserved in {backup_path}")
                
                return False
                
        except Exception as e:
            self.log(f"Error sending logs to Kalaw: {e}", "error")
            self.stats["errors"] += 1
            
            if self.slack_alerts:
                self.send_slack_alert(f"Error in Codex log forwarder: {e}")
            
            return False

    def send_slack_alert(self, message: str) -> None:
        """
        Send an alert to Slack
        
        Args:
            message: Alert message to send
        """
        try:
            slack_webhook = os.popen("pulser vault:get slack/codex_alerts_webhook").read().strip()
            
            if not slack_webhook:
                self.log("Could not retrieve Slack webhook URL from vault", "error")
                return
            
            payload = {
                "text": f"🚨 Codex Log Forwarder Alert 🚨\n{message}",
                "username": "Codex Log Forwarder",
                "icon_emoji": ":robot_face:"
            }
            
            response = requests.post(
                slack_webhook,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                self.log(f"Failed to send Slack alert: {response.status_code} {response.text}", "error")
        except Exception as e:
            self.log(f"Error sending Slack alert: {e}", "error")

    def save_stats(self) -> None:
        """Save statistics about the log forwarder run"""
        try:
            # Add end time
            self.stats["end_time"] = datetime.now(timezone.utc).isoformat()
            self.stats["runtime_seconds"] = (datetime.now(timezone.utc) - 
                                           datetime.fromisoformat(self.stats["start_time"].replace('Z', '+00:00'))).total_seconds()
            
            # Format and save stats
            stats_file = "codex_log_forwarder_stats.json"
            with open(stats_file, "w") as f:
                json.dump(self.stats, f, indent=2)
            
            self.log(f"Statistics saved to {stats_file}", "info")
            
            # If there were errors, also log error count to a separate file for easier monitoring
            if self.stats["errors"] > 0:
                with open("codex_log_forwarder_errors_count.txt", "w") as f:
                    f.write(str(self.stats["errors"]))
        except Exception as e:
            self.log(f"Error saving statistics: {e}", "error")

    def handle_signal(self, signum, frame) -> None:
        """
        Handle termination signals
        
        Args:
            signum: Signal number
            frame: Current stack frame
        """
        signal_name = signal.Signals(signum).name
        self.log(f"Received signal {signal_name} ({signum}), shutting down gracefully...", "info")
        global shutdown_requested
        shutdown_requested = True

    def print_stats(self) -> None:
        """Print statistics about the log forwarder run"""
        self.log("\n--- Log Forwarder Statistics ---", "info")
        self.log(f"Start time: {self.stats['start_time']}", "info")
        self.log(f"End time: {datetime.now(timezone.utc).isoformat()}", "info")
        self.log(f"Logs processed: {self.stats['logs_processed']}", "info")
        self.log(f"Logs filtered: {self.stats['logs_filtered']}", "info")
        self.log(f"Batches sent: {self.stats['batches_sent']}", "info")
        self.log(f"Errors: {self.stats['errors']}", "info")
        self.log(f"Connection retries: {self.stats['connection_retries']}", "info")
        self.log("-------------------------------", "info")

    def run(self) -> None:
        """
        Main log forwarder loop
        """
        # Set up signal handlers
        signal.signal(signal.SIGINT, self.handle_signal)
        signal.signal(signal.SIGTERM, self.handle_signal)
        
        self.log(f"Starting Codex v2 log forwarder to Kalaw (bucket: {self.kalaw_bucket})", "info")
        self.log(f"Log level: {self.log_level}, Batch size: {self.batch_size}, Flush interval: {self.flush_interval_sec}s", "info")
        
        global shutdown_requested
        shutdown_requested = False
        
        try:
            sse_response = self.connect_to_log_stream()
            
            # Reset retry counter on successful connection
            self.connection_retry_count = 0
            self.connection_retry_delay = 5
            
            for line in sse_response.iter_lines():
                # Check if shutdown was requested
                if shutdown_requested:
                    self.log("Shutdown requested, stopping log processing", "info")
                    break
                
                if line:
                    # Parse SSE data line
                    if line.startswith(b"data: "):
                        data = line[6:].decode("utf-8")
                        
                        # Handle heartbeat messages
                        if data.strip() == "[HEARTBEAT]":
                            current_time = time.time()
                            if (current_time - self.last_flush_time > self.flush_interval_sec and 
                                self.logs_buffer):
                                self.log("Heartbeat received, flushing logs due to time interval...", "debug")
                                self.send_logs_to_kalaw()
                                self.logs_buffer = []
                                self.last_flush_time = current_time
                            continue
                            
                        try:
                            log_entry = json.loads(data)
                            processed_entry = self.process_log_entry(log_entry)
                            
                            # Add to buffer if not filtered out
                            if processed_entry:
                                self.logs_buffer.append(processed_entry)
                                
                                # Log critical events for immediate attention
                                if (processed_entry.get("level", "").lower() == "critical" and 
                                    self.slack_alerts):
                                    self.send_slack_alert(
                                        f"Critical event in Codex logs: {processed_entry.get('message', 'No message')}")
                        except json.JSONDecodeError:
                            self.log(f"Failed to parse log entry: {data[:100]}...", "error")
                            continue
                    
                    # Check if we should flush logs
                    if len(self.logs_buffer) >= self.batch_size:
                        self.log(f"Batch size reached ({self.batch_size} logs), flushing...", "debug")
                        self.send_logs_to_kalaw()
                        self.logs_buffer = []
                        self.last_flush_time = time.time()
                    
                    # Check time-based flush
                    elif (time.time() - self.last_flush_time > self.flush_interval_sec and 
                          self.logs_buffer):
                        self.log(f"Flush interval reached ({self.flush_interval_sec}s), flushing {len(self.logs_buffer)} logs...", "debug")
                        self.send_logs_to_kalaw()
                        self.logs_buffer = []
                        self.last_flush_time = time.time()
        
        except KeyboardInterrupt:
            self.log("\nLog forwarder interrupted by user", "info")
        
        except Exception as e:
            self.log(f"Error in log forwarder: {e}", "critical")
            self.stats["errors"] += 1
            
            if self.slack_alerts:
                self.send_slack_alert(f"Codex log forwarder encountered a critical error: {e}")
        
        finally:
            # Flush any remaining logs
            if self.logs_buffer:
                self.log(f"Flushing {len(self.logs_buffer)} remaining logs before shutdown", "info")
                self.send_logs_to_kalaw()
            
            # Print and save stats
            self.print_stats()
            self.save_stats()


def parse_args() -> argparse.Namespace:
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Codex v2 Log Forwarder to Kalaw")
    
    parser.add_argument("--endpoint", 
                      default=DEFAULT_CODEX_LOGS_ENDPOINT,
                      help=f"Codex v2 logs endpoint (default: {DEFAULT_CODEX_LOGS_ENDPOINT})")
    
    parser.add_argument("--bucket", 
                      default=DEFAULT_KALAW_BUCKET,
                      help=f"Kalaw bucket destination (default: {DEFAULT_KALAW_BUCKET})")
    
    parser.add_argument("--batch-size", 
                      type=int,
                      default=DEFAULT_LOG_BATCH_SIZE,
                      help=f"Number of logs to batch before sending (default: {DEFAULT_LOG_BATCH_SIZE})")
    
    parser.add_argument("--flush-interval", 
                      type=int,
                      default=DEFAULT_LOG_FLUSH_INTERVAL_SEC,
                      help=f"Maximum time between flushes in seconds (default: {DEFAULT_LOG_FLUSH_INTERVAL_SEC})")
    
    parser.add_argument("--log-level", 
                      choices=["debug", "info", "warning", "error", "critical"],
                      default=DEFAULT_LOG_LEVEL,
                      help=f"Minimum log level to process (default: {DEFAULT_LOG_LEVEL})")
    
    parser.add_argument("--retention-days",
                      type=int,
                      default=DEFAULT_RETENTION_DAYS,
                      help=f"Number of days to retain logs in Kalaw (default: {DEFAULT_RETENTION_DAYS})")
    
    parser.add_argument("--format",
                      choices=["jsonl", "json", "csv"],
                      default=DEFAULT_LOG_FORMAT,
                      help=f"Format for log storage (default: {DEFAULT_LOG_FORMAT})")
    
    parser.add_argument("--no-slack-alerts",
                      action="store_true",
                      help="Disable Slack alerts for critical errors")
    
    parser.add_argument("--audit-mode",
                      action="store_true",
                      help="Enable audit mode with checksums for compliance")
    
    parser.add_argument("--daemon",
                      action="store_true",
                      help="Run as a daemon process in the background")
    
    parser.add_argument("--pid-file",
                      default="/tmp/codex_to_kalaw.pid",
                      help="PID file location when running as daemon (default: /tmp/codex_to_kalaw.pid)")
    
    return parser.parse_args()


def create_daemon(pid_file: str) -> None:
    """
    Create a daemon process
    
    Args:
        pid_file: Path to the PID file
    """
    # Check if already running
    if os.path.exists(pid_file):
        with open(pid_file, "r") as f:
            pid = f.read().strip()
        
        # Check if process is still running
        try:
            os.kill(int(pid), 0)
            print(f"Daemon already running with PID {pid}")
            sys.exit(1)
        except (OSError, ValueError):
            # Process not running, remove stale PID file
            os.remove(pid_file)
    
    # Fork the first time
    try:
        pid = os.fork()
        if pid > 0:
            # Exit the parent process
            sys.exit(0)
    except OSError as e:
        print(f"Fork #1 failed: {e}")
        sys.exit(1)
    
    # Decouple from parent environment
    os.chdir("/")
    os.setsid()
    os.umask(0)
    
    # Fork the second time
    try:
        pid = os.fork()
        if pid > 0:
            # Exit from second parent
            sys.exit(0)
    except OSError as e:
        print(f"Fork #2 failed: {e}")
        sys.exit(1)
    
    # Redirect standard file descriptors
    sys.stdout.flush()
    sys.stderr.flush()
    
    with open("/dev/null", "r") as stdin_f:
        os.dup2(stdin_f.fileno(), sys.stdin.fileno())
    
    log_file = "/tmp/codex_to_kalaw.log"
    with open(log_file, "a") as stdout_f:
        os.dup2(stdout_f.fileno(), sys.stdout.fileno())
        os.dup2(stdout_f.fileno(), sys.stderr.fileno())
    
    # Write PID file
    with open(pid_file, "w") as f:
        f.write(str(os.getpid()))
    
    print(f"Daemon started with PID {os.getpid()}, logging to {log_file}")


def main() -> None:
    """Main entry point"""
    args = parse_args()
    
    # Run as daemon if requested
    if args.daemon:
        create_daemon(args.pid_file)
    
    forwarder = CodexLogForwarder(
        codex_logs_endpoint=args.endpoint,
        kalaw_bucket=args.bucket,
        batch_size=args.batch_size,
        flush_interval_sec=args.flush_interval,
        log_level=args.log_level,
        retention_days=args.retention_days,
        log_format=args.format,
        slack_alerts=not args.no_slack_alerts,
        audit_mode=args.audit_mode
    )
    
    try:
        forwarder.run()
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()