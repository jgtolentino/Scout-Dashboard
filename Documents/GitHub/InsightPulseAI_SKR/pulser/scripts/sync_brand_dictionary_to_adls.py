#!/usr/bin/env python3
"""
Brand Dictionary Sync to Azure Data Lake Storage
Syncs brand dictionary data from local/SQL sources to ADLS containers
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime
from azure.storage.blob import BlobServiceClient
from azure.identity import DefaultAzureCredential

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BrandDictionarySync:
    def __init__(self, connection_string=None, account_name=None, container_name="brand-dictionary"):
        """Initialize the brand dictionary sync client"""
        self.container_name = container_name
        
        if connection_string:
            self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        elif account_name:
            credential = DefaultAzureCredential()
            account_url = f"https://{account_name}.blob.core.windows.net"
            self.blob_service_client = BlobServiceClient(account_url=account_url, credential=credential)
        else:
            raise ValueError("Either connection_string or account_name must be provided")
    
    def create_brand_dictionary(self):
        """Create brand dictionary data structure"""
        brand_dictionary = {
            "version": "1.0",
            "lastUpdated": datetime.now().isoformat(),
            "brandFamilies": {
                "Del Monte": {
                    "category": "Food & Beverage",
                    "brands": ["Del Monte", "Del Monte Gold", "Del Monte Fresh"],
                    "keywords": ["del monte", "delmonte", "fresh", "canned fruits", "tomato sauce"],
                    "productCategories": ["Canned Goods", "Fresh Produce", "Sauces"]
                },
                "Oishi": {
                    "category": "Snacks",
                    "brands": ["Oishi", "Oishi Prawn Crackers", "Oishi Smart C+"],
                    "keywords": ["oishi", "prawn crackers", "smart c", "snacks", "crackers"],
                    "productCategories": ["Snacks", "Beverages", "Crackers"]
                },
                "Alaska": {
                    "category": "Dairy",
                    "brands": ["Alaska Milk", "Alaska Crema", "Alaska Fortified"],
                    "keywords": ["alaska", "milk", "crema", "fortified", "dairy"],
                    "productCategories": ["Milk", "Dairy Products", "Powdered Milk"]
                },
                "Peerless": {
                    "category": "Beverages",
                    "brands": ["Peerless", "Peerless Distilled Water", "Peerless Premium"],
                    "keywords": ["peerless", "distilled water", "premium water", "beverages"],
                    "productCategories": ["Water", "Beverages", "Distilled Water"]
                }
            },
            "metadata": {
                "totalBrands": 4,
                "totalProducts": 16,
                "dataSource": "TBWA Brand Registry",
                "syncedBy": "brand_dictionary_sync_script"
            }
        }
        return brand_dictionary
    
    def upload_brand_dictionary(self, data, blob_name="brand_dictionary.json"):
        """Upload brand dictionary to ADLS"""
        try:
            # Convert data to JSON string
            json_data = json.dumps(data, indent=2, ensure_ascii=False)
            
            # Upload to blob storage
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name, 
                blob=blob_name
            )
            
            blob_client.upload_blob(json_data, overwrite=True)
            logger.info(f"Successfully uploaded {blob_name} to container {self.container_name}")
            
            # Also create timestamped backup
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"backups/brand_dictionary_{timestamp}.json"
            backup_blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=backup_name
            )
            backup_blob_client.upload_blob(json_data, overwrite=True)
            logger.info(f"Created backup at {backup_name}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to upload brand dictionary: {str(e)}")
            return False
    
    def validate_upload(self, blob_name="brand_dictionary.json"):
        """Validate the uploaded brand dictionary"""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            
            # Download and validate JSON
            blob_data = blob_client.download_blob().readall()
            parsed_data = json.loads(blob_data)
            
            # Basic validation
            required_keys = ["version", "lastUpdated", "brandFamilies", "metadata"]
            for key in required_keys:
                if key not in parsed_data:
                    raise ValueError(f"Missing required key: {key}")
            
            logger.info(f"Validation successful: {len(parsed_data['brandFamilies'])} brand families found")
            return True
            
        except Exception as e:
            logger.error(f"Validation failed: {str(e)}")
            return False

def main():
    parser = argparse.ArgumentParser(description="Sync brand dictionary to Azure Data Lake Storage")
    parser.add_argument("--connection-string", help="Azure Storage connection string")
    parser.add_argument("--account-name", help="Azure Storage account name")
    parser.add_argument("--container", default="brand-dictionary", help="Container name")
    parser.add_argument("--validate", action="store_true", help="Validate upload after completion")
    
    args = parser.parse_args()
    
    # Get connection details from environment if not provided
    connection_string = args.connection_string or os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    account_name = args.account_name or os.getenv("STORAGE_ACCOUNT_NAME")
    
    if not connection_string and not account_name:
        logger.error("Either --connection-string, --account-name, or environment variables must be set")
        sys.exit(1)
    
    try:
        # Initialize sync client
        sync_client = BrandDictionarySync(
            connection_string=connection_string,
            account_name=account_name,
            container_name=args.container
        )
        
        # Create brand dictionary data
        logger.info("Creating brand dictionary data...")
        brand_data = sync_client.create_brand_dictionary()
        
        # Upload to ADLS
        logger.info(f"Uploading to container: {args.container}")
        success = sync_client.upload_brand_dictionary(brand_data)
        
        if not success:
            sys.exit(1)
        
        # Validate if requested
        if args.validate:
            logger.info("Validating upload...")
            if not sync_client.validate_upload():
                sys.exit(1)
        
        logger.info("Brand dictionary sync completed successfully!")
        
    except Exception as e:
        logger.error(f"Script failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()