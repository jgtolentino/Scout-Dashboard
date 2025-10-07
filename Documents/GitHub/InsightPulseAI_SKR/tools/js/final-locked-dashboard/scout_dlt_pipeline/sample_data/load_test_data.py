#!/usr/bin/env python3
"""
Sample data loader for Scout DLT Pipeline
Loads simulated Sari-Sari store data into Event Hubs for testing the pipeline
"""

import json
import os
import time
import random
import argparse
from datetime import datetime, timedelta
from azure.eventhub import EventHubProducerClient, EventData
from azure.identity import DefaultAzureCredential

# Configuration (Override with environment variables or command line arguments)
DEFAULT_EVENTHUB_NAMESPACE = os.environ.get("EVENTHUB_NAMESPACE", "scout-eh-namespace-abc123")
DEFAULT_EVENTHUB_STT = os.environ.get("EVENTHUB_STT", "eh-pi-stt-raw")
DEFAULT_EVENTHUB_VISUAL = os.environ.get("EVENTHUB_VISUAL", "eh-pi-visual-stream")
DEFAULT_EVENTHUB_HEARTBEAT = os.environ.get("EVENTHUB_HEARTBEAT", "eh-device-heartbeat")
DEFAULT_CONNECTION_STRING_ENV = "EVENTHUB_CONNECTION_STRING"

def load_data_from_file(file_path):
    """Load JSON data from a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading data from {file_path}: {e}")
        return None

def update_timestamps(data, shift_hours=0):
    """Update timestamps in the data to current time"""
    now = datetime.utcnow()
    base_time = now - timedelta(hours=shift_hours)
    
    for item in data:
        # Parse original timestamp
        orig_time = datetime.fromisoformat(item["timestamp"].replace("Z", "+00:00"))
        
        # Calculate time difference from start of original dataset
        if "first_time" not in update_timestamps.__dict__:
            update_timestamps.first_time = min([datetime.fromisoformat(x["timestamp"].replace("Z", "+00:00")) for x in data])
        
        time_diff = orig_time - update_timestamps.first_time
        
        # Create new timestamp with the same offset from current base time
        new_time = base_time + time_diff
        
        # Update timestamp
        item["timestamp"] = new_time.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    
    return data

def send_to_eventhub(connection_string, eventhub_name, data):
    """Send data to Event Hub"""
    if not data:
        print(f"No data to send to {eventhub_name}")
        return
    
    try:
        # Create a producer client
        producer = EventHubProducerClient.from_connection_string(
            conn_str=connection_string,
            eventhub_name=eventhub_name
        )
        
        # Create a batch
        event_data_batch = producer.create_batch()
        
        # Add events to the batch
        for item in data:
            # Convert to JSON string
            item_json = json.dumps(item)
            # Create an event data object
            event_data = EventData(item_json)
            # Add to batch
            try:
                event_data_batch.add(event_data)
            except ValueError:
                # If batch is full, send it and create a new one
                producer.send_batch(event_data_batch)
                event_data_batch = producer.create_batch()
                event_data_batch.add(event_data)
        
        # Send the batch
        producer.send_batch(event_data_batch)
        print(f"Sent {len(data)} records to {eventhub_name}")
        
    except Exception as e:
        print(f"Error sending data to Event Hub {eventhub_name}: {e}")
    finally:
        # Close the producer
        producer.close()

def main():
    """Main function to load and send sample data"""
    parser = argparse.ArgumentParser(description='Load simulated Sari-Sari store data into Azure Event Hubs')
    parser.add_argument('--connection-string', help='Event Hub connection string')
    parser.add_argument('--namespace', default=DEFAULT_EVENTHUB_NAMESPACE, help='Event Hub namespace')
    parser.add_argument('--stt-hub', default=DEFAULT_EVENTHUB_STT, help='Speech-to-text Event Hub name')
    parser.add_argument('--visual-hub', default=DEFAULT_EVENTHUB_VISUAL, help='Visual data Event Hub name')
    parser.add_argument('--heartbeat-hub', default=DEFAULT_EVENTHUB_HEARTBEAT, help='Heartbeat Event Hub name')
    parser.add_argument('--continuous', action='store_true', help='Send data continuously')
    parser.add_argument('--interval', type=int, default=5, help='Interval between data sends in seconds')
    parser.add_argument('--realtime', action='store_true', help='Update timestamps to current time')
    
    args = parser.parse_args()
    
    # Get connection string
    connection_string = args.connection_string
    if not connection_string:
        connection_string = os.environ.get(DEFAULT_CONNECTION_STRING_ENV)
    
    if not connection_string:
        print("Event Hub connection string not provided. Using simulated mode.")
        simulate_only = True
    else:
        simulate_only = False
    
    # Locate data files
    script_dir = os.path.dirname(os.path.abspath(__file__))
    stt_file = os.path.join(script_dir, "sari_sari_simulated_data.json")
    visual_file = os.path.join(script_dir, "sari_sari_visual_data.json")
    heartbeat_file = os.path.join(script_dir, "sari_sari_heartbeat_data.json")
    
    # Load data
    print("Loading sample data...")
    stt_data = load_data_from_file(stt_file)
    visual_data = load_data_from_file(visual_file)
    heartbeat_data = load_data_from_file(heartbeat_file)
    
    if not stt_data or not visual_data or not heartbeat_data:
        print("Failed to load sample data. Exiting.")
        return
    
    print(f"Loaded {len(stt_data)} STT records, {len(visual_data)} visual records, and {len(heartbeat_data)} heartbeat records")
    
    # Send data once or continuously
    iteration = 0
    while True:
        iteration += 1
        print(f"\nIteration {iteration}")
        
        # Update timestamps if in realtime mode
        if args.realtime:
            hours_offset = 0 if iteration == 1 else random.randint(0, 4)
            stt_data_updated = update_timestamps(stt_data.copy(), hours_offset)
            visual_data_updated = update_timestamps(visual_data.copy(), hours_offset)
            heartbeat_data_updated = update_timestamps(heartbeat_data.copy(), hours_offset)
        else:
            stt_data_updated = stt_data
            visual_data_updated = visual_data
            heartbeat_data_updated = heartbeat_data
        
        # Send to Event Hubs
        if not simulate_only:
            send_to_eventhub(connection_string, args.stt_hub, stt_data_updated)
            send_to_eventhub(connection_string, args.visual_hub, visual_data_updated)
            send_to_eventhub(connection_string, args.heartbeat_hub, heartbeat_data_updated)
        else:
            print("SIMULATION MODE: Would send the following data counts to Event Hubs:")
            print(f"  - STT Event Hub ({args.stt_hub}): {len(stt_data_updated)} records")
            print(f"  - Visual Event Hub ({args.visual_hub}): {len(visual_data_updated)} records")
            print(f"  - Heartbeat Event Hub ({args.heartbeat_hub}): {len(heartbeat_data_updated)} records")
        
        # Exit if not continuous, otherwise wait for the next iteration
        if not args.continuous:
            break
        
        print(f"Waiting {args.interval} seconds before sending next batch...")
        time.sleep(args.interval)

if __name__ == "__main__":
    main()