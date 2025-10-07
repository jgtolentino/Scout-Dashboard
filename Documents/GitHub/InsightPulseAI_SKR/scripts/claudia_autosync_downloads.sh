#!/bin/bash

# Set directories
DOWNLOADS="/Users/tbwa/Downloads"
SKR_ROOT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR"
AGENTS_DIR="$SKR_ROOT/agents"
MODULES_DIR="$SKR_ROOT/modules"
DASHBOARDS_DIR="$SKR_ROOT/dashboards"
ARTIFACTS_DIR="$SKR_ROOT/SKR/03_Artifacts"
APRAOCHED_DIR="$SKR_ROOT/00_APRAOCHED"
CONTEXT_DIR="$SKR_ROOT/context_exports"
BACKUP_DIR="$SKR_ROOT/backups"
DNS_CONFIG_DIR="$SKR_ROOT/dns_configs"
TEMP_DIR="/tmp/claudia_skr_temp"
SKR_INBOX="$SKR_ROOT/SKR/inbox"
LOG_FILE="$HOME/claudia_sync.log"

# Create directories if they don't exist
mkdir -p "$AGENTS_DIR" "$MODULES_DIR" "$DASHBOARDS_DIR" "$ARTIFACTS_DIR" "$APRAOCHED_DIR" "$CONTEXT_DIR" "$BACKUP_DIR" "$DNS_CONFIG_DIR" "$TEMP_DIR" "$SKR_INBOX"

echo "🧿 Claudia Autosync Started in watch mode..." | tee -a "$LOG_FILE"

# Initialize cycle counter
CYCLE_COUNT=0

github_sync() {
  # --- GitHub Sync Block ---
  cd $SKR_ROOT

  # Stage any new or updated files inside SKR
  git add SKR/inbox/*

  # Only commit if there are changes
  if ! git diff --cached --quiet; then
    COMMIT_MSG="🔄 Claudia SKR Sync – $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"
    git push
    echo "$(date): 🛰 GitHub sync complete: $COMMIT_MSG" | tee -a "$LOG_FILE"
  else
    echo "$(date): 💤 No changes to sync to GitHub." | tee -a "$LOG_FILE"
  fi
}

process_files() {
  # Unzip specifically InsightPulseAI content packages, excluding backups and exports
  for zip in $DOWNLOADS/InsightPulseAI*.zip; do
    # Skip backups and context exports
    if [[ -f "$zip" && "$(basename "$zip")" != "InsightPulseAI_SKR_Full_Backup"* && "$(basename "$zip")" != "Jake_InsightPulseAI_Context_Export"* ]]; then
      echo "$(date): 📦 Found ZIP: $zip" | tee -a "$LOG_FILE"
      unzip -o "$zip" -d "$DOWNLOADS"
      rm "$zip"
      echo "$(date): ✅ Unzipped: $zip" | tee -a "$LOG_FILE"
    fi
  done

  # Process context exports
  for zip in $DOWNLOADS/Jake_InsightPulseAI_Context_Export*.zip; do
    if [ -f "$zip" ]; then
      echo "$(date): 📂 Found Context Export: $zip" | tee -a "$LOG_FILE"
      timestamp=$(date "+%Y%m%d_%H%M%S")
      export_dir="$CONTEXT_DIR/export_$timestamp"
      mkdir -p "$export_dir"
      unzip -o "$zip" -d "$export_dir"
      
      # Create a metadata file
      echo "# Context Export Metadata" > "$export_dir/metadata.yaml"
      echo "timestamp: $timestamp" >> "$export_dir/metadata.yaml"
      echo "source_file: $(basename "$zip")" >> "$export_dir/metadata.yaml"
      echo "imported_by: Claudia" >> "$export_dir/metadata.yaml"
      
      mv "$zip" "$CONTEXT_DIR/$(basename "$zip")"
      echo "$(date): ✅ Context Export synced to $export_dir" | tee -a "$LOG_FILE"
    fi
  done

  # Process full backups
  for zip in $DOWNLOADS/InsightPulseAI_SKR_Full_Backup*.zip; do
    if [ -f "$zip" ]; then
      echo "$(date): 💾 Found Full Backup: $zip" | tee -a "$LOG_FILE"
      timestamp=$(date "+%Y%m%d_%H%M%S")
      backup_filename="backup_$timestamp.zip"
      
      # Create a hash of the file for verification
      file_hash=$(shasum -a 256 "$zip" | cut -d' ' -f1)
      
      # Create a metadata file
      metadata_file="$BACKUP_DIR/backup_$timestamp.yaml"
      echo "# Backup Metadata" > "$metadata_file"
      echo "timestamp: $timestamp" >> "$metadata_file"
      echo "source_file: $(basename "$zip")" >> "$metadata_file"
      echo "file_hash: $file_hash" >> "$metadata_file"
      echo "imported_by: Claudia" >> "$metadata_file"
      echo "backup_status: verified" >> "$metadata_file"
      
      # Copy backup to backup directory with timestamped name
      cp "$zip" "$BACKUP_DIR/$backup_filename"
      
      # Remove original after copying
      rm "$zip"
      
      echo "$(date): 💾 Full Backup synced: $backup_filename (Hash: ${file_hash:0:8}...)" | tee -a "$LOG_FILE"
    fi
  done

  # Route each YAML based on naming convention
  for file in $DOWNLOADS/*.yaml; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")

      if [[ "$filename" == agent_* ]]; then
        mv "$file" "$AGENTS_DIR/$filename"
        echo "$(date): ✅ Agent routed: $filename" | tee -a "$LOG_FILE"
      elif [[ "$filename" == skr_mod_* ]]; then
        mv "$file" "$MODULES_DIR/$filename"
        echo "$(date): 📦 Module routed: $filename" | tee -a "$LOG_FILE"
      elif [[ "$filename" == skr_dash_* ]]; then
        mv "$file" "$DASHBOARDS_DIR/$filename"
        echo "$(date): 📊 Dashboard routed: $filename" | tee -a "$LOG_FILE"
      elif [[ "$filename" == apraoched_* ]]; then
        mv "$file" "$APRAOCHED_DIR/$filename"
        echo "$(date): 🧿 Claudia updated strategy: $filename → synced to /00_APRAOCHED/" | tee -a "$LOG_FILE"
      elif [[ "$filename" == *router.yaml ]]; then
        # Handle router configuration files
        mv "$file" "$SKR_ROOT/$filename"
        echo "$(date): 🧭 Router config updated: $filename → synced to root" | tee -a "$LOG_FILE"
      elif [[ "$filename" == *conventions.yaml ]]; then
        # Handle conventions files
        mkdir -p "$SKR_ROOT/config"
        mv "$file" "$SKR_ROOT/config/$filename"
        echo "$(date): 📝 Conventions updated: $filename → synced to /config/" | tee -a "$LOG_FILE"
      elif [[ "$filename" == skr_docs*.yaml ]]; then
        # Handle SKR docs configuration
        mv "$file" "$SKR_ROOT/SKR/$filename"
        echo "$(date): 📚 SKR docs config updated: $filename → synced to /SKR/" | tee -a "$LOG_FILE"
      else
        # Filter specific file types to avoid warning spam in logs
        if [[ "$filename" =~ skr_docs.yaml|claudia_router.yaml|conventions.yaml|"(1).yaml" ]]; then
          # Silently skip known files
          echo "$(date): [SILENT] Skipped expected file: $filename" >> "$LOG_FILE"
        else
          echo "$(date): ⚠️ Skipped unrecognized file: $filename" | tee -a "$LOG_FILE"
        fi
      fi
    fi
  done

  # Route apraoched markdown files
  for file in $DOWNLOADS/apraoched_*.md; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      mv "$file" "$APRAOCHED_DIR/$filename"
      echo "$(date): 🧿 Claudia updated strategy: $filename → synced to /00_APRAOCHED/" | tee -a "$LOG_FILE"
    fi
  done

  # Route Enrico DNS config files
  for file in $DOWNLOADS/enrico_*.md; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      mv "$file" "$DNS_CONFIG_DIR/$filename"
      echo "$(date): 🌐 Enrico DNS config synced: $filename → saved to /dns_configs/" | tee -a "$LOG_FILE"
    fi
  done

  # Route PDF documents
  for file in $DOWNLOADS/skr_doc_*.pdf; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      mv "$file" "$ARTIFACTS_DIR/$filename"
      echo "$(date): 📚 Document routed to artifacts: $filename" | tee -a "$LOG_FILE"
    fi
  done

  # Process _skr_ ZIP files
  for zip in $DOWNLOADS/*_skr_*.zip; do
    if [ -f "$zip" ]; then
      echo "$(date): 🔄 Found SKR ZIP: $zip" | tee -a "$LOG_FILE"
      
      # Create temp directory if it doesn't exist
      mkdir -p "$TEMP_DIR"
      
      # Extract filename without extension for metadata
      base_filename=$(basename "$zip" .zip)
      
      # Unzip to temp directory
      unzip -o "$zip" -d "$TEMP_DIR/$base_filename"
      
      # Create inbox directory with timestamp
      timestamp=$(date "+%Y%m%d_%H%M%S")
      inbox_dir="$SKR_INBOX/${base_filename}_$timestamp"
      mkdir -p "$inbox_dir"
      
      # Check for metadata.yaml in the extracted content
      if [ -f "$TEMP_DIR/$base_filename/metadata.yaml" ]; then
        # Parse metadata type
        metadata_type=$(grep "type:" "$TEMP_DIR/$base_filename/metadata.yaml" | cut -d':' -f2 | tr -d ' ')
        
        echo "$(date): 📋 Metadata type: $metadata_type" | tee -a "$LOG_FILE"
        
        # Route based on metadata
        if [[ "$metadata_type" == "workflow" || "$metadata_type" == "agent" ]]; then
          echo "$(date): 🔀 Detected $metadata_type - delegating to Kalaw" | tee -a "$LOG_FILE"
          # Copy to inbox first
          cp -r "$TEMP_DIR/$base_filename"/* "$inbox_dir/"
          
          # Create a log entry in the inbox directory
          echo "# Processing Log" > "$inbox_dir/claudia_process.log"
          echo "timestamp: $timestamp" >> "$inbox_dir/claudia_process.log"
          echo "source_file: $(basename "$zip")" >> "$inbox_dir/claudia_process.log"
          echo "metadata_type: $metadata_type" >> "$inbox_dir/claudia_process.log"
          echo "status: delegated_to_kalaw" >> "$inbox_dir/claudia_process.log"
          
          # Run Kalaw's processing script if it exists
          if [ -f "$SKR_ROOT/scripts/kalaw_llm_router.sh" ]; then
            bash "$SKR_ROOT/scripts/kalaw_llm_router.sh" "$base_filename" "$metadata_type" "$inbox_dir"
            echo "$(date): 🧠 Kalaw processing initiated" | tee -a "$LOG_FILE"
          else
            # If Kalaw's script doesn't exist, just copy to SKR root
            cp -r "$TEMP_DIR/$base_filename"/* "$SKR_ROOT/"
            echo "$(date): ⚠️ Kalaw router not found - copying to SKR root" | tee -a "$LOG_FILE"
          fi
        else
          # Default routing to SKR root and inbox
          echo "$(date): 📦 Routing to SKR root and inbox" | tee -a "$LOG_FILE"
          cp -r "$TEMP_DIR/$base_filename"/* "$inbox_dir/"
          cp -r "$TEMP_DIR/$base_filename"/* "$SKR_ROOT/"
          
          # Create a log entry in the inbox directory
          echo "# Processing Log" > "$inbox_dir/claudia_process.log"
          echo "timestamp: $timestamp" >> "$inbox_dir/claudia_process.log"
          echo "source_file: $(basename "$zip")" >> "$inbox_dir/claudia_process.log"
          echo "metadata_type: $metadata_type" >> "$inbox_dir/claudia_process.log"
          echo "status: copied_to_skr_root" >> "$inbox_dir/claudia_process.log"
        fi
      else
        # If no metadata, simply route to SKR root and inbox
        echo "$(date): ⚠️ No metadata found - routing to SKR root and inbox" | tee -a "$LOG_FILE"
        cp -r "$TEMP_DIR/$base_filename"/* "$inbox_dir/"
        cp -r "$TEMP_DIR/$base_filename"/* "$SKR_ROOT/"
        
        # Create a log entry in the inbox directory
        echo "# Processing Log" > "$inbox_dir/claudia_process.log"
        echo "timestamp: $timestamp" >> "$inbox_dir/claudia_process.log"
        echo "source_file: $(basename "$zip")" >> "$inbox_dir/claudia_process.log"
        echo "metadata_type: unknown" >> "$inbox_dir/claudia_process.log"
        echo "status: copied_to_skr_root" >> "$inbox_dir/claudia_process.log"
      fi
      
      # Clean up
      rm -rf "$TEMP_DIR/$base_filename"
      rm "$zip"
      echo "$(date): ✅ Processed SKR ZIP: $base_filename" | tee -a "$LOG_FILE"
      
      # Sync to GitHub after processing SKR ZIP
      github_sync
    fi
  done
}

# Run periodic validation for Pulser MVP
pulser_validation() {
  # Only run validation once per hour (to avoid excessive builds)
  current_hour=$(date +%H)
  last_check_hour=$(cat /tmp/pulser_last_check 2>/dev/null || echo "")
  
  if [ "$current_hour" != "$last_check_hour" ]; then
    echo "$(date): 🔍 Running Pulser MVP validation check..." | tee -a "$LOG_FILE"
    
    # Run the validation script if it exists
    if [ -f "$SKR_ROOT/scripts/pulser_validate.sh" ]; then
      bash "$SKR_ROOT/scripts/pulser_validate.sh"
      echo "$current_hour" > /tmp/pulser_last_check
    else
      echo "$(date): ⚠️ Pulser validation script not found" | tee -a "$LOG_FILE"
    fi
  fi
}

# Run in continuous loop mode for launchd
while true; do
  process_files
  
  # Check cycle count for periodic tasks
  CYCLE_COUNT=$((CYCLE_COUNT+1))
  
  # Print a heartbeat message every 10 cycles (approximately every ~2 minutes)
  if (( SECONDS % 100 < 10 )); then
    echo "$(date): 💓 Claudia AutoSync heartbeat - still watching..." | tee -a "$LOG_FILE"
    
    # Run Pulser validation during heartbeat (once per hour)
    pulser_validation
  fi
  
  # Sleep before next check
  sleep 10
done