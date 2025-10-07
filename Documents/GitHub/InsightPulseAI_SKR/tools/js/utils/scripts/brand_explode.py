#!/usr/bin/env python3
# brand_explode.py - Brand mention extraction and enrichment tool for STT
# For Echo (STT + Signal Parsing) and Kalaw (Named Entity Linking)
# Created: 2025-05-12

import os
import sys
import json
import logging
import argparse
import datetime
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
import sqlalchemy as sa
from sqlalchemy import create_engine, text
import spacy

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("brand_explode.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("brand_explode")

# Load NER model for brand extraction
try:
    nlp = spacy.load("en_core_web_lg")
    logger.info("Loaded spaCy model successfully")
except Exception as e:
    logger.error(f"Failed to load spaCy model: {str(e)}")
    nlp = None


class BrandMentionExtractor:
    """Extracts brand mentions from transcripts and enriches Kalaw's entity knowledge"""
    
    def __init__(self, conn_string: str, kalaw_skr_path: str = None):
        """
        Initialize the extractor
        
        Args:
            conn_string: Database connection string
            kalaw_skr_path: Path to Kalaw's SKR directory for entity sync
        """
        self.conn_string = conn_string
        self.kalaw_skr_path = kalaw_skr_path or os.path.expanduser(
            "~/Documents/GitHub/InsightPulseAI_SKR/SKR/transcripts/entity_mentions/"
        )
        self.engine = None
        self.known_brands = self._load_known_brands()
        self.setup_db_connection()
        
    def setup_db_connection(self):
        """Establish database connection"""
        try:
            self.engine = create_engine(self.conn_string)
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Failed to connect to database: {str(e)}")
            self.engine = None
    
    def _load_known_brands(self) -> List[str]:
        """Load known brand list for improved recognition"""
        try:
            # Look for brands file in SKR
            brands_path = os.path.join(
                os.path.dirname(self.kalaw_skr_path), 
                "reference_data", 
                "known_brands.json"
            )
            
            if os.path.exists(brands_path):
                with open(brands_path, 'r') as f:
                    return json.load(f)
            else:
                # Default list if file not found
                return [
                    "Nike", "Adidas", "Pepsi", "Coca-Cola", "Samsung", "Apple", 
                    "Google", "Microsoft", "Amazon", "Facebook", "Twitter", 
                    "Jollibee", "Globe Telecom", "PLDT", "Smart", "BDO", "BPI",
                    "Metrobank", "SM", "Ayala", "Bench", "Penshoppe", "Mercury Drug"
                ]
        except Exception as e:
            logger.error(f"Error loading known brands: {str(e)}")
            return []
    
    def get_transcripts(self, status: List[str] = None, interaction_id: str = None) -> pd.DataFrame:
        """
        Retrieve transcripts from database with specified status or interaction ID

        Args:
            status: List of transcript statuses to include
            interaction_id: Specific interaction ID to retrieve (overrides status filter)
            
        Returns:
            DataFrame with transcript data
        """
        if not self.engine:
            logger.error("Database connection not established")
            return pd.DataFrame()
        
        try:
            # Build the WHERE clause based on parameters
            where_clause = "TranscriptionText IS NOT NULL"
            params = {}

            if interaction_id:
                # Filter by specific interaction ID for testing
                where_clause += " AND InteractionID = :interaction_id"
                params["interaction_id"] = interaction_id
                logger.info(f"Filtering for test interaction ID: {interaction_id}")
            elif status:
                # Filter by status
                where_clause += " AND status IN :status"
                params["status"] = tuple(status)
                logger.info(f"Filtering for status: {status}")

            query = text(f"""
                SELECT
                    InteractionID,
                    ChunkIndex,
                    ChunkText,           -- Updated: Using ChunkText per transcript_field_map standard
                    ChunkTimestamp,
                    DeviceID
                FROM
                    dbo.SalesInteractionTranscripts
                WHERE
                    {where_clause}
                ORDER BY
                    InteractionID, ChunkIndex
            """)
            
            with self.engine.connect() as conn:
                return pd.read_sql(query, conn, params=params)
        
        except Exception as e:
            logger.error(f"Error fetching transcripts: {str(e)}")
            # For demo/dev purposes, generate sample data if DB fails
            return self._generate_sample_transcripts()
    
    def _generate_sample_transcripts(self) -> pd.DataFrame:
        """Generate sample transcript data for testing/demo"""
        logger.warning("Generating demo transcripts - NOT PRODUCTION DATA")
        
        sample_data = []
        devices = ["raspi_scout_017", "raspi_scout_042", "edgecam_tbwa_005", 
                   "raspi_scout_025", "edgecam_tbwa_008"]
        
        sample_texts = [
            "I think Nike has the best running shoes for marathon training compared to other brands.",
            "Would you prefer Pepsi or Coca-Cola with your meal? Pepsi is on promotion this week.",
            "The new Samsung phone has amazing camera quality, much better than last year's model.",
            "Many customers love Jollibee's ChickenJoy, it's our bestselling item this month.",
            "Globe Telecom offers better coverage in this area compared to other providers.",
            "Nike just released their new collection that's getting popular with younger customers.",
            "Samsung and Apple are the top choices for premium smartphones in our store.",
            "Pepsi is running a special promotion with Jollibee this summer.",
            "The Globe Telecom family plan includes Netflix subscription as a bonus."
        ]
        
        # Generate sample transcript chunks
        for i in range(30):
            device = devices[i % len(devices)]
            interaction_id = f"DEMO_{device}_{i//3}"
            chunk_index = i % 3
            text = sample_texts[i % len(sample_texts)]
            
            sample_data.append({
                "InteractionID": interaction_id,
                "ChunkIndex": chunk_index,
                "TranscriptionText": text,
                "ChunkTimestamp": datetime.datetime.now() - datetime.timedelta(hours=i),
                "DeviceID": device
            })
        
        return pd.DataFrame(sample_data)
    
    def extract_brands(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract brand mentions from text using NLP
        
        Args:
            text: The transcript text to analyze
            
        Returns:
            List of detected brands with confidence scores
        """
        if not text or not isinstance(text, str):
            return []
        
        if not nlp:
            return self._rule_based_extraction(text)
        
        try:
            # Process with spaCy
            doc = nlp(text)
            
            # Extract organizations and products as potential brands
            extracted_brands = []
            for ent in doc.ents:
                if ent.label_ in ["ORG", "PRODUCT", "GPE"]:
                    brand_name = ent.text.strip()
                    
                    # Check if this matches our known brands list (case insensitive)
                    known_brand_match = next(
                        (kb for kb in self.known_brands 
                         if kb.lower() == brand_name.lower()), 
                        None
                    )
                    
                    if known_brand_match:
                        # Use canonical spelling from known brands list
                        brand_name = known_brand_match
                        confidence = 0.9  # Higher confidence for known brands
                    else:
                        confidence = 0.7  # Lower confidence for unknown brands
                    
                    extracted_brands.append({
                        "brand": brand_name,
                        "confidence": confidence,
                        "start": ent.start_char,
                        "end": ent.end_char,
                        "type": ent.label_
                    })
            
            return extracted_brands
            
        except Exception as e:
            logger.error(f"Error in NLP brand extraction: {str(e)}")
            return self._rule_based_extraction(text)
    
    def _rule_based_extraction(self, text: str) -> List[Dict[str, Any]]:
        """
        Fallback rule-based brand extraction
        
        Args:
            text: The transcript text to analyze
            
        Returns:
            List of detected brands with confidence scores
        """
        extracted_brands = []
        text_lower = text.lower()
        
        for brand in self.known_brands:
            brand_lower = brand.lower()
            if brand_lower in text_lower:
                # Find all occurrences
                start = 0
                while True:
                    start = text_lower.find(brand_lower, start)
                    if start == -1:
                        break
                    
                    extracted_brands.append({
                        "brand": brand,  # Use canonical spelling
                        "confidence": 0.85,
                        "start": start,
                        "end": start + len(brand_lower),
                        "type": "RULE_BASED"
                    })
                    
                    start += len(brand_lower)
        
        return extracted_brands
    
    def store_brand_mentions(self, mentions: List[Dict[str, Any]]) -> bool:
        """
        Store extracted brand mentions in the database
        
        Args:
            mentions: List of brand mention records to store
            
        Returns:
            Success status
        """
        if not self.engine or not mentions:
            return False
        
        try:
            # Convert to DataFrame for efficient bulk insert
            df = pd.DataFrame(mentions)
            
            # Insert into database
            with self.engine.begin() as conn:
                df.to_sql(
                    "TranscriptEntityMentions",
                    conn,
                    schema="dbo",
                    if_exists="append",
                    index=False
                )
            
            logger.info(f"Successfully stored {len(mentions)} brand mentions")
            return True
            
        except Exception as e:
            logger.error(f"Error storing brand mentions: {str(e)}")
            return False
    
    def sync_to_kalaw(self, aggregated_mentions: Dict[str, int]) -> bool:
        """
        Sync brand mention data to Kalaw's SKR
        
        Args:
            aggregated_mentions: Dictionary of brands and their frequencies
            
        Returns:
            Success status
        """
        if not self.kalaw_skr_path:
            logger.warning("SKR path not set, skipping Kalaw sync")
            return False
        
        try:
            # Ensure directory exists
            os.makedirs(self.kalaw_skr_path, exist_ok=True)
            
            # Create timestamped output file
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = os.path.join(
                self.kalaw_skr_path, 
                f"brand_mentions_{timestamp}.json"
            )
            
            # Write aggregated data
            with open(output_path, 'w') as f:
                json.dump({
                    "generated_at": datetime.datetime.now().isoformat(),
                    "brand_mentions": [
                        {"brand": brand, "frequency": freq}
                        for brand, freq in aggregated_mentions.items()
                    ],
                    "source": "Echo.brand_explode.py"
                }, f, indent=2)
            
            logger.info(f"Successfully synced brand mentions to Kalaw SKR: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error syncing to Kalaw: {str(e)}")
            return False
    
    def process_transcripts(self, status: List[str] = None, interaction_id: str = None) -> Dict[str, Any]:
        """
        Main processing function to extract and store brand mentions

        Args:
            status: List of transcript statuses to process
            interaction_id: Specific interaction ID to process (for testing)
            
        Returns:
            Processing results summary
        """
        # Get transcripts
        df = self.get_transcripts(status, interaction_id)
        if df.empty:
            logger.warning("No transcripts found to process")
            return {"status": "warning", "message": "No transcripts found"}

        # Log mode of operation
        if interaction_id:
            logger.info(f"TEST MODE: Processing transcripts for test ID: {interaction_id}")
        else:
            logger.info(f"NORMAL MODE: Processing transcripts with status filter: {status}")
        
        logger.info(f"Processing {len(df)} transcript chunks")
        
        # Process each transcript
        all_mentions = []
        brand_frequency = {}
        device_brand_frequency = {}
        
        for _, row in df.iterrows():
            # Extract brands from ChunkText field (standardized field naming)
            brands = self.extract_brands(row["ChunkText"])
            
            # Add metadata
            for brand in brands:
                mention_record = {
                    "InteractionID": row["InteractionID"],
                    "ChunkIndex": row["ChunkIndex"],
                    "MentionedBrand": brand["brand"],
                    "ConfidenceScore": brand["confidence"],
                    "DeviceID": row.get("DeviceID", None),
                    "DetectedAt": datetime.datetime.now().isoformat()
                }
                all_mentions.append(mention_record)
                
                # Track frequencies
                brand_name = brand["brand"]
                device_id = row.get("DeviceID", "unknown")
                
                brand_frequency[brand_name] = brand_frequency.get(brand_name, 0) + 1
                
                if device_id not in device_brand_frequency:
                    device_brand_frequency[device_id] = {}
                
                device_brand_frequency[device_id][brand_name] = \
                    device_brand_frequency[device_id].get(brand_name, 0) + 1
        
        # Store mentions in database
        db_success = self.store_brand_mentions(all_mentions)
        
        # Sync to Kalaw SKR
        skr_success = self.sync_to_kalaw(brand_frequency)
        
        # Generate brand frequency report
        top_brands = []
        for device_id, brands in device_brand_frequency.items():
            for brand, count in sorted(brands.items(), key=lambda x: x[1], reverse=True)[:3]:
                top_brands.append({
                    "brand": brand,
                    "frequency": count,
                    "device": device_id
                })
        
        # Create output report
        output_report = {
            "extraction_time": datetime.datetime.now().isoformat(),
            "total_transcripts_processed": len(df),
            "total_brand_mentions_found": len(all_mentions),
            "unique_brands_found": len(brand_frequency),
            "database_sync_success": db_success,
            "skr_sync_success": skr_success,
            "top_mentions": sorted(top_brands, key=lambda x: x["frequency"], reverse=True)[:5]
        }
        
        # Create a branded demo output for Markus
        demo_format = "\n🧠 Exploded Brand Mentions (from Reconstructed Transcripts)\n\n"
        demo_format += "| Brand         | Frequency | Detected In        |\n"
        demo_format += "| ------------- | --------- | ------------------ |\n"
        
        for mention in output_report["top_mentions"]:
            brand_padded = mention["brand"].ljust(13)
            freq_padded = str(mention["frequency"]).ljust(9)
            device_padded = mention["device"].ljust(18)
            demo_format += f"| {brand_padded} | {freq_padded} | {device_padded} |\n"
        
        demo_format += "\n> Source: Echo → Kalaw enrichment → partial `brand_mentions.json`\n"
        
        output_report["demo_format"] = demo_format
        
        # Save the full report
        report_path = "brand_mentions_report.json"
        with open(report_path, 'w') as f:
            json.dump(output_report, f, indent=2)
            
        logger.info(f"Processing complete. Report saved to {report_path}")
        return output_report


def main():
    parser = argparse.ArgumentParser(description="Extract brand mentions from transcripts")
    parser.add_argument("--conn", help="Database connection string")
    parser.add_argument("--skr", help="Path to Kalaw's SKR directory")
    parser.add_argument("--status", help="Comma-separated list of transcript statuses to process")
    parser.add_argument("--demo", action="store_true", help="Run in demo mode with sample data")
    parser.add_argument("--test-id", help="Process only a specific test InteractionID")
    parser.add_argument("--prod", action="store_true", help="Run in production mode with safety checks")
    args = parser.parse_args()
    
    # Default connection string (replace with actual in production)
    conn_string = args.conn or "mssql+pyodbc://user:pass@server/database?driver=ODBC+Driver+17+for+SQL+Server"
    
    # Create extractor
    extractor = BrandMentionExtractor(
        conn_string=conn_string if not args.demo else "demo://",
        kalaw_skr_path=args.skr
    )
    
    # Handle test mode for controlled testing
    if args.test_id:
        logger.info(f"Running in test mode for specific InteractionID: {args.test_id}")
        # Process only the test interaction, regardless of status
        results = extractor.process_transcripts(interaction_id=args.test_id)
    else:
        # Normal processing by status
        status_filter = args.status.split(",") if args.status else ["complete", "validated"]

        # Add safety confirmation for production runs
        if args.prod and not args.demo:
            logger.warning("⚠️ Running in PRODUCTION mode with real data!")
            confirmation = input("Are you sure you want to process real production data? (yes/no): ")
            if confirmation.lower() not in ["yes", "y"]:
                logger.info("Operation cancelled by user")
                sys.exit(0)

        # Process transcripts
        results = extractor.process_transcripts(status=status_filter)
    
    # Print demo format for Markus
    if "demo_format" in results:
        print("\n" + "="*60)
        print(results["demo_format"])
        print("="*60 + "\n")
    
    print(f"Processing complete. Found {results['total_brand_mentions_found']} brand mentions.")
    print(f"Full report saved to brand_mentions_report.json")


if __name__ == "__main__":
    main()