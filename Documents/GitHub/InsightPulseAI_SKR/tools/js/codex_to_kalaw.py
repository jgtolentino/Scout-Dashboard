#!/usr/bin/env python3
# codex_to_kalaw.py - Log forwarder from Codex v2 to Kalaw

import json
import os
import time
import sys
import requests
import argparse
from datetime import datetime
from typing import Dict, Any, List, Optional

# Default configuration
DEFAULT_LOG_BATCH_SIZE = 100
DEFAULT_LOG_FLUSH_INTERVAL_SEC = 60
DEFAULT_KALAW_BUCKET = "skr://codex-logs/"
DEFAULT_LOG_LEVEL = "info"

class CodexLogForwarder:
    """
    Log forwarder from Codex v2 to Kalaw storage
    
    This class handles the connection to Codex v2's log stream via SSE,
    processes the log entries, and forwards them to Kalaw in batches.
    """
    
    def __init__(self, 
                 codex_logs_endpoint: str, 
                 kalaw_bucket: str,
                 batch_size: int = DEFAULT_LOG_BATCH_SIZE,
                 flush_interval_sec: int = DEFAULT_LOG_FLUSH_INTERVAL_SEC,
                 log_level: str = DEFAULT_LOG_LEVEL):
        """
        Initialize the log forwarder
        
        Args:
            codex_logs_endpoint: URL for the Codex v2 logs stream
            kalaw_bucket: Destination bucket in Kalaw
            batch_size: Number of logs to batch before sending
            flush_interval_sec: Maximum time between flushes
            log_level: Minimum log level to process
        """
        self.codex_logs_endpoint = codex_logs_endpoint
        self.kalaw_bucket = kalaw_bucket
        self.batch_size = batch_size
        self.flush_interval_sec = flush_interval_sec
        self.log_level = log_level.lower()
        
        self.logs_buffer = []
        self.last_flush_time = time.time()
        self.stats = {
            "logs_processed": 0,
            "batches_sent": 0,
            "errors": 0,
            "start_time": datetime.utcnow().isoformat() + "Z"
        }
        
        # Validate log level
        valid_levels = ["debug", "info", "warning", "error", "critical"]
        if self.log_level not in valid_levels:
            print(f"Invalid log level: {self.log_level}. Using 'info' instead.")
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
    
    def get_openai_token(self) -> str:
        """
        Get OpenAI API token from Pulser vault
        
        Returns:
            str: OpenAI API token
        
        Raises:
            ValueError: If token retrieval fails
        """
        result = os.popen("pulser vault:get codex/openai_api_key").read().strip()
        if not result:
            raise ValueError("Failed to get OpenAI API key from vault")
        return result

    def get_kalaw_token(self) -> str:
        """
        Get Kalaw API token from Pulser vault
        
        Returns:
            str: Kalaw API token
        
        Raises:
            ValueError: If token retrieval fails
        """
        result = os.popen("pulser vault:get kalaw/api_token").read().strip()
        if not result:
            raise ValueError("Failed to get Kalaw API token from vault")
        return result

    def connect_to_log_stream(self):
        """
        Connect to Codex v2 log stream via SSE
        
        Returns:
            requests.Response: Streaming response object
        
        Raises:
            requests.HTTPError: If connection fails
        """
        openai_token = self.get_openai_token()
        headers = {
            "Authorization": f"Bearer {openai_token}",
            "Accept": "text/event-stream"
        }
        
        print(f"Connecting to Codex v2 log stream at {self.codex_logs_endpoint}...")
        response = requests.get(
            self.codex_logs_endpoint,
            headers=headers,
            stream=True
        )
        response.raise_for_status()
        print("Connected to log stream successfully.")
        return response

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
                return None
        
        # Add timestamp and source metadata
        enriched_entry = log_entry.copy()
        enriched_entry.update({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "source": "codex_v2",
            "log_forwarder_version": "1.0.0"
        })
        
        # Add request correlation ID if available
        if "request_id" not in enriched_entry and "correlation_id" in enriched_entry:
            enriched_entry["request_id"] = enriched_entry["correlation_id"]
        
        return enriched_entry

    def send_logs_to_kalaw(self):
        """
        Send batch of logs to Kalaw
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.logs_buffer:
            return True
            
        kalaw_token = self.get_kalaw_token()
        batch_filename = f"codex_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jsonl"
        batch_path = os.path.join("/tmp", batch_filename)
        
        # Write logs to JSONL file
        with open(batch_path, "w") as f:
            for log in self.logs_buffer:
                f.write(json.dumps(log) + "\n")
        
        # Upload to Kalaw
        upload_cmd = f"pulser exec kalaw:upload --file {batch_path} --dest {self.kalaw_bucket} --token {kalaw_token}"
        result = os.system(upload_cmd)
        
        logs_count = len(self.logs_buffer)
        
        if result == 0:
            print(f"Successfully uploaded {logs_count} log entries to {self.kalaw_bucket}{batch_filename}")
            self.stats["batches_sent"] += 1
            self.stats["logs_processed"] += logs_count
            # Clean up
            os.remove(batch_path)
            return True
        else:
            print(f"Failed to upload logs to Kalaw, exit code: {result}")
            self.stats["errors"] += 1
            return False

    def run(self):
        """
        Main log forwarder loop
        """
        print(f"Starting Codex v2 log forwarder to Kalaw (bucket: {self.kalaw_bucket})...")
        print(f"Log level: {self.log_level}, Batch size: {self.batch_size}, Flush interval: {self.flush_interval_sec}s")
        
        try:
            sse_response = self.connect_to_log_stream()
            for line in sse_response.iter_lines():
                if line:
                    # Parse SSE data line
                    if line.startswith(b"data: "):
                        data = line[6:].decode("utf-8")
                        
                        # Handle heartbeat messages
                        if data.strip() == "[HEARTBEAT]":
                            current_time = time.time()
                            if current_time - self.last_flush_time > self.flush_interval_sec and self.logs_buffer:
                                print("Heartbeat received, flushing logs due to time interval...")
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
                        except json.JSONDecodeError:
                            print(f"Failed to parse log entry: {data}")
                            continue
                    
                    # Check if we should flush logs
                    if len(self.logs_buffer) >= self.batch_size:
                        print(f"Batch size reached ({self.batch_size} logs), flushing...")
                        self.send_logs_to_kalaw()
                        self.logs_buffer = []
                        self.last_flush_time = time.time()
                    
                    # Check time-based flush
                    elif time.time() - self.last_flush_time > self.flush_interval_sec and self.logs_buffer:
                        print(f"Flush interval reached ({self.flush_interval_sec}s), flushing {len(self.logs_buffer)} logs...")
                        self.send_logs_to_kalaw()
                        self.logs_buffer = []
                        self.last_flush_time = time.time()
        
        except KeyboardInterrupt:
            print("\nLog forwarder interrupted, flushing remaining logs...")
            self.send_logs_to_kalaw()
            self.print_stats()
        
        except Exception as e:
            print(f"Error in log forwarder: {e}")
            # Attempt to flush any remaining logs
            self.send_logs_to_kalaw()
            self.stats["errors"] += 1
            self.print_stats()
            raise
    
    def print_stats(self):
        """Print statistics about the log forwarder run"""
        print("\n--- Log Forwarder Statistics ---")
        print(f"Start time: {self.stats['start_time']}")
        print(f"End time: {datetime.utcnow().isoformat()}Z")
        print(f"Logs processed: {self.stats['logs_processed']}")
        print(f"Batches sent: {self.stats['batches_sent']}")
        print(f"Errors: {self.stats['errors']}")
        print("-------------------------------")

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Codex v2 Log Forwarder to Kalaw")
    
    parser.add_argument("--endpoint", 
                        default="https://api.openai.com/v2/codex/logs/stream",
                        help="Codex v2 logs endpoint")
    
    parser.add_argument("--bucket", 
                        default=DEFAULT_KALAW_BUCKET,
                        help="Kalaw bucket destination")
    
    parser.add_argument("--batch-size", 
                        type=int,
                        default=DEFAULT_LOG_BATCH_SIZE,
                        help="Number of logs to batch before sending")
    
    parser.add_argument("--flush-interval", 
                        type=int,
                        default=DEFAULT_LOG_FLUSH_INTERVAL_SEC,
                        help="Maximum time between flushes in seconds")
    
    parser.add_argument("--log-level", 
                        choices=["debug", "info", "warning", "error", "critical"],
                        default=DEFAULT_LOG_LEVEL,
                        help="Minimum log level to process")
    
    return parser.parse_args()

def main():
    """Main entry point"""
    args = parse_args()
    
    forwarder = CodexLogForwarder(
        codex_logs_endpoint=args.endpoint,
        kalaw_bucket=args.bucket,
        batch_size=args.batch_size,
        flush_interval_sec=args.flush_interval,
        log_level=args.log_level
    )
    
    try:
        forwarder.run()
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()