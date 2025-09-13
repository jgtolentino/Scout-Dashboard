#!/usr/bin/env python3
"""
generate_test_data.py - Generate test data for Juicer GenAI Insights

This script generates sample transcript data for testing the Juicer GenAI Insights system.
It creates mock transcripts with brand mentions and sentiment, and uploads them to Azure Blob Storage.
"""

import argparse
import csv
import json
import os
import random
import uuid
from datetime import datetime, timedelta
from azure.storage.blob import BlobServiceClient

# Sample brands
BRANDS = [
    "Jollibee", "McDonald's", "KFC", "Burger King", "Wendy's", 
    "Pizza Hut", "Taco Bell", "Subway", "Starbucks", "Dunkin' Donuts"
]

# Sample sentiments
SENTIMENTS = ["positive", "negative", "neutral", "mixed"]

# Sample topics
TOPICS = [
    "pricing", "value", "quality", "service", "speed", "cleanliness", 
    "menu options", "variety", "taste", "freshness", "convenience", 
    "location", "app experience", "delivery", "ambiance", 
    "loyalty program", "promotions", "family-friendly", "breakfast", 
    "lunch", "dinner", "late-night", "drive-thru", "mobile ordering"
]

# Sample agents
AGENTS = ["agent1", "agent2", "agent3", "agent4", "agent5"]

# Sample customer IDs
CUSTOMERS = [f"customer{i}" for i in range(1, 21)]

def generate_brand_mentions(num_brands=3):
    """Generate a random list of brand mentions"""
    return random.sample(BRANDS, min(num_brands, len(BRANDS)))

def generate_sentiment():
    """Generate random sentiment for brands"""
    return {brand: random.choice(SENTIMENTS) for brand in generate_brand_mentions(random.randint(1, 3))}

def generate_topic_categories(num_topics=3):
    """Generate random topic categories"""
    return random.sample(TOPICS, min(num_topics, len(TOPICS)))

def generate_transcript_text(brands, topics):
    """Generate a mock transcript that mentions the given brands and topics"""
    paragraphs = []
    
    # Introduction
    intro = f"Agent: Hello, thank you for calling customer support. How can I help you today?\n\n"
    paragraphs.append(intro)
    
    # Customer query with brand mentions
    customer_query = f"Customer: Hi, I'm trying to decide between {' and '.join(brands)}. "
    customer_query += f"I'm particularly interested in {random.choice(topics)} and {random.choice(topics)}.\n\n"
    paragraphs.append(customer_query)
    
    # Agent response with more brand mentions
    agent_response = f"Agent: I understand you're comparing {' and '.join(brands)}. "
    agent_response += f"Let me provide some information about their {random.choice(topics)}.\n\n"
    paragraphs.append(agent_response)
    
    # Add brand-specific discussions
    for brand in brands:
        brand_para = f"Customer: What about {brand}? "
        brand_para += f"I've heard they have great {random.choice(topics)}.\n\n"
        paragraphs.append(brand_para)
        
        agent_reply = f"Agent: {brand} is known for their {random.choice(topics)}. "
        agent_reply += f"Many customers appreciate their {random.choice(topics)} as well.\n\n"
        paragraphs.append(agent_reply)
    
    # Conclusion
    conclusion = f"Customer: Thanks for the information. I think I'll try {random.choice(brands)} first.\n\n"
    conclusion += f"Agent: You're welcome! Enjoy your experience with {random.choice(brands)}. Is there anything else I can help with today?\n\n"
    conclusion += f"Customer: No, that's all. Thank you!\n\n"
    conclusion += f"Agent: Thank you for contacting customer support. Have a great day!"
    paragraphs.append(conclusion)
    
    return "".join(paragraphs)

def generate_transcript_summary(brands, topics):
    """Generate a summary for the transcript"""
    return f"Customer inquired about {', '.join(brands)} with focus on {', '.join(topics)}. Agent provided information about each brand's offerings and differentiators."

def generate_speaker_summary():
    """Generate a speaker summary for the transcript"""
    return "Agent provided detailed information about product offerings. Customer expressed interest in multiple brands and decided on a preferred option."

def generate_mock_transcripts(num_transcripts, start_date, end_date):
    """Generate a specified number of mock transcripts within a date range"""
    transcripts = []
    
    date_range = (end_date - start_date).days
    
    for i in range(num_transcripts):
        # Generate random date within range
        random_days = random.randint(0, date_range)
        interaction_date = start_date + timedelta(days=random_days)
        
        # Generate transcript data
        brands = generate_brand_mentions()
        topics = generate_topic_categories()
        
        transcript = {
            "transcript_id": f"transcript_{uuid.uuid4().hex[:8]}",
            "interaction_id": f"interaction_{uuid.uuid4().hex[:8]}",
            "agent_id": random.choice(AGENTS),
            "customer_id": random.choice(CUSTOMERS),
            "full_transcript": generate_transcript_text(brands, topics),
            "transcript_summary": generate_transcript_summary(brands, topics),
            "speaker_summary": generate_speaker_summary(),
            "interaction_date": interaction_date.strftime("%Y-%m-%d"),
            "brand_mentions": brands,
            "brand_sentiment": generate_sentiment(),
            "topic_categories": topics
        }
        
        transcripts.append(transcript)
    
    return transcripts

def write_to_csv(transcripts, output_file):
    """Write transcripts to CSV file"""
    with open(output_file, 'w', newline='') as csvfile:
        # Define CSV headers based on transcript keys
        fieldnames = transcripts[0].keys()
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for transcript in transcripts:
            # Convert lists and dicts to strings for CSV
            row = transcript.copy()
            for key, value in row.items():
                if isinstance(value, (list, dict)):
                    row[key] = json.dumps(value)
            writer.writerow(row)
    
    print(f"Generated {len(transcripts)} transcripts to {output_file}")

def upload_to_azure(csv_file, storage_connection_string, container_name):
    """Upload CSV file to Azure Blob Storage"""
    try:
        # Create BlobServiceClient
        blob_service_client = BlobServiceClient.from_connection_string(storage_connection_string)
        
        # Get container client
        container_client = blob_service_client.get_container_client(container_name)
        
        # Upload file
        blob_name = os.path.basename(csv_file)
        with open(csv_file, "rb") as data:
            container_client.upload_blob(name=blob_name, data=data, overwrite=True)
        
        print(f"Uploaded {csv_file} to container {container_name} as {blob_name}")
        return True
    except Exception as e:
        print(f"Error uploading to Azure: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Generate test data for Juicer GenAI Insights')
    parser.add_argument('--count', type=int, default=100, help='Number of transcripts to generate')
    parser.add_argument('--start-date', type=str, default='2025-04-01', help='Start date for transcripts (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default='2025-05-10', help='End date for transcripts (YYYY-MM-DD)')
    parser.add_argument('--output', type=str, default='test_transcripts.csv', help='Output CSV file')
    parser.add_argument('--upload', action='store_true', help='Upload to Azure Blob Storage')
    parser.add_argument('--connection-string', type=str, help='Azure Storage connection string')
    parser.add_argument('--container', type=str, default='bronze', help='Azure Storage container name')
    
    args = parser.parse_args()
    
    # Parse dates
    start_date = datetime.strptime(args.start_date, '%Y-%m-%d')
    end_date = datetime.strptime(args.end_date, '%Y-%m-%d')
    
    # Generate transcripts
    transcripts = generate_mock_transcripts(args.count, start_date, end_date)
    
    # Write to CSV
    write_to_csv(transcripts, args.output)
    
    # Upload to Azure if requested
    if args.upload:
        if not args.connection_string:
            print("Error: Connection string is required for uploading to Azure")
            return
        
        upload_to_azure(args.output, args.connection_string, args.container)

if __name__ == "__main__":
    main()