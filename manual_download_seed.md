# Manual Download and Seed Instructions

Since the automated download is encountering permission issues, here's how to proceed:

## Option 1: Download via Azure Storage Explorer

1. Install Azure Storage Explorer: https://azure.microsoft.com/en-us/features/storage-explorer/
2. Use this connection string from your portal:
   ```
   BlobEndpoint=https://projectscoutdata.blob.core.windows.net/;QueueEndpoint=https://projectscoutdata.queue.core.windows.net/;FileEndpoint=https://projectscoutdata.file.core.windows.net/;TableEndpoint=https://projectscoutdata.table.core.windows.net/;SharedAccessSignature=sv=2024-11-04&ss=bftq&srt=sco&sp=rwdlacupyx&se=2025-06-25T11:38:48Z&st=2025-06-25T03:38:48Z&spr=https&sig=e%2Bl7CHVDDfTLvFHUI43laqJ%2FBEV7LDsSphkNLgDwso%3D
   ```
3. Navigate to: `scoutdata/raw/scout-seed/`
4. Download all CSV files to a local folder

## Option 2: Use AzCopy Command Line

```bash
# Install azcopy
brew install azcopy

# Download files
azcopy copy "https://projectscoutdata.blob.core.windows.net/scoutdata/raw/scout-seed/*?sv=2024-11-04&ss=bftq&srt=sco&sp=rwdlacupyx&se=2025-06-25T11:38:48Z&st=2025-06-25T03:38:48Z&spr=https&sig=e%2Bl7CHVDDfTLvFHUI43laqJ%2FBEV7LDsSphkNLgDwso%3D" "./scout_data/" --recursive
```

## Option 3: Direct Browser Download

Try these direct links in your browser:

1. https://projectscoutdata.blob.core.windows.net/scoutdata/raw/scout-seed/brands.csv?sv=2024-11-04&ss=bftq&srt=sco&sp=rwdlacupyx&se=2025-06-25T11:38:48Z&st=2025-06-25T03:38:48Z&spr=https&sig=e%2Bl7CHVDDfTLvFHUI43laqJ%2FBEV7LDsSphkNLgDwso%3D

2. https://projectscoutdata.blob.core.windows.net/scoutdata/raw/scout-seed/customers.csv?sv=2024-11-04&ss=bftq&srt=sco&sp=rwdlacupyx&se=2025-06-25T11:38:48Z&st=2025-06-25T03:38:48Z&spr=https&sig=e%2Bl7CHVDDfTLvFHUI43laqJ%2FBEV7LDsSphkNLgDwso%3D

(Continue for all files: devices.csv, products.csv, stores.csv, transactions.csv, transaction_items.csv, request_behaviors.csv, substitution.csv)

## Once Downloaded:

1. Place all CSV files in a folder called `scout_data`
2. Run the seeding script:

```python
python3 seed_local_csvs.py
```

This script will:
- Connect to your Azure SQL database
- Create the `poc` schema
- Create tables based on CSV structure
- Load all data into the tables