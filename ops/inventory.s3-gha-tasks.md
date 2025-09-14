# S3-First ETL GitHub Actions Tasks

## ✅ CI Lake Ingestion (S3-first)
- **SCOUT-GHA-DRV-001** — Drive→S3 Bronze (rclone) — scheduled 10m
- **SCOUT-GHA-S3-001** — S3 scan→enqueue — scheduled 5m  
- **SCOUT-GHA-WKR-001** — S3 ingest worker→Postgres — scheduled 5m

## Task Details

### SCOUT-GHA-DRV-001: Drive to S3 Bronze Sync
- **Frequency**: Every 10 minutes
- **Method**: rclone with Google Drive Service Account
- **Target**: s3://{bronze-bucket}/drive/
- **Dependencies**: GDRIVE_SA_JSON_B64, AWS credentials, S3_BRONZE_BUCKET
- **Workflow**: `.github/workflows/drive-to-s3.yml`

### SCOUT-GHA-S3-001: S3 Scan & Enqueue  
- **Frequency**: Every 5 minutes
- **Method**: AWS CLI + Supabase RPC calls
- **Prefixes**: drive/, azure/
- **Function**: Calls ops.enqueue_if_new() for each object
- **Workflow**: `.github/workflows/s3-scan-enqueue.yml`

### SCOUT-GHA-WKR-001: S3 Ingest Worker
- **Frequency**: Every 5 minutes
- **Method**: Stream S3 objects directly to Postgres
- **Batch Size**: 200 objects per run
- **Formats**: CSV (auto-schema), JSON/JSONL (jsonb)
- **Target**: stage.{table_name} tables
- **Workflow**: `.github/workflows/s3-ingest-worker.yml`

## Required GitHub Secrets

```
SUPABASE_URL
SUPABASE_SERVICE_KEY  
SUPABASE_PG_URL_REMOTE        # pooler URL
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
S3_BRONZE_BUCKET              # e.g. scout-lake-poc-bronze
GDRIVE_FOLDER_ID              # 1j3CGrL1r_jX_K21mstrSh8lrLNzDnpiA
GDRIVE_SA_JSON_B64            # base64 of service account JSON
```

## Data Flow

```
Google Drive → S3 Bronze (every 10m)
     ↓
S3 Scan → ops.ingest_queue (every 5m)  
     ↓
S3 Worker → stage.* tables (every 5m)
     ↓
Link & Extract RPC → analytics (every 5m)
```