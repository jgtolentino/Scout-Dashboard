#!/usr/bin/env python3
"""
skr_dedupe.py - Compact SKR memory by removing redundant entries

This script analyzes the Semantic Knowledge Repository entries and 
removes duplicates or near-duplicates based on semantic similarity.
"""

import os
import sys
import yaml
import json
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
from tqdm import tqdm
from rich.console import Console
from rich.table import Table
import faiss
import dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
import openai

# Setup logging with rich
console = Console()

def load_config():
    """Load configuration from environment or config file"""
    dotenv.load_dotenv()
    config_path = Path(os.environ.get('SKR_CONFIG_PATH', 'config/skr_config.yaml'))
    
    if config_path.exists():
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    else:
        console.print(f"[yellow]Warning: Config file not found at {config_path}, using defaults[/yellow]")
        return {
            'skr_path': os.environ.get('SKR_PATH', Path(__file__).parent.parent / 'SKR'),
            'similarity_threshold': float(os.environ.get('SIMILARITY_THRESHOLD', 0.85)),
            'api_key': os.environ.get('OPENAI_API_KEY', ''),
            'backup_enabled': os.environ.get('BACKUP_ENABLED', 'true').lower() == 'true',
        }

def create_backup(skr_path):
    """Create a backup of the SKR directory"""
    backup_path = Path(f"{skr_path}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
    
    console.print(f"[blue]Creating backup at {backup_path}[/blue]")
    
    # Use system command for faster directory copy
    os.system(f"cp -r {skr_path} {backup_path}")
    
    return backup_path

def load_skr_entries(skr_path):
    """Load all SKR entries from the directory"""
    entries = []
    skr_path = Path(skr_path)
    
    console.print(f"[blue]Loading SKR entries from {skr_path}[/blue]")
    
    # Walk through all directories in SKR
    for root, _, files in os.walk(skr_path):
        for file in files:
            if file.endswith(('.json', '.md', '.txt')):
                file_path = Path(root) / file
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Extract metadata if JSON, otherwise use file metadata
                    metadata = {}
                    if file.endswith('.json'):
                        try:
                            data = json.loads(content)
                            if isinstance(data, dict):
                                metadata = data.get('metadata', {})
                                content = data.get('content', content)
                        except json.JSONDecodeError:
                            pass
                    
                    entries.append({
                        'path': str(file_path),
                        'content': content,
                        'metadata': metadata,
                        'last_modified': os.path.getmtime(file_path),
                        'size': os.path.getsize(file_path)
                    })
                except Exception as e:
                    console.print(f"[red]Error loading {file_path}: {e}[/red]")
    
    console.print(f"[green]Loaded {len(entries)} SKR entries[/green]")
    return entries

def compute_embeddings(entries, config):
    """Compute embeddings for SKR entries using OpenAI API or simple TF-IDF"""
    
    if config.get('api_key') and openai:
        console.print("[blue]Computing embeddings using OpenAI API[/blue]")
        try:
            openai.api_key = config['api_key']
            embeddings = []
            
            for entry in tqdm(entries, desc="Computing embeddings"):
                response = openai.embeddings.create(
                    model="text-embedding-3-small",
                    input=entry['content'][:8000]  # Limit to 8000 chars
                )
                embeddings.append(response.data[0].embedding)
            
            embeddings = np.array(embeddings, dtype=np.float32)
            return embeddings
        except Exception as e:
            console.print(f"[red]Error using OpenAI embeddings: {e}[/red]")
            console.print("[yellow]Falling back to TF-IDF embeddings[/yellow]")
    
    # Fallback to TF-IDF embeddings
    console.print("[blue]Computing TF-IDF embeddings[/blue]")
    vectorizer = TfidfVectorizer(max_features=512)
    contents = [entry['content'] for entry in entries]
    tfidf_matrix = vectorizer.fit_transform(contents)
    
    # Normalize embeddings
    tfidf_norm = np.sqrt((tfidf_matrix.toarray() ** 2).sum(axis=1))
    tfidf_norm = np.where(tfidf_norm == 0, 1, tfidf_norm)  # Avoid division by zero
    embeddings = tfidf_matrix.toarray() / tfidf_norm[:, np.newaxis]
    
    return embeddings.astype(np.float32)

def find_duplicates(embeddings, threshold):
    """Find duplicate entries using FAISS similarity search"""
    console.print(f"[blue]Finding duplicates with similarity threshold {threshold}[/blue]")
    
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
    index.add(embeddings)
    
    # Search for similar vectors
    similarities, indices = index.search(embeddings, 10)  # Get top 10 similar entries
    
    duplicate_groups = []
    processed = set()
    
    for i in range(len(embeddings)):
        if i in processed:
            continue
            
        group = [i]
        for j, sim in zip(indices[i][1:], similarities[i][1:]):  # Skip self
            if sim >= threshold and j not in processed:
                group.append(j)
                processed.add(j)
                
        if len(group) > 1:  # Only add groups with duplicates
            duplicate_groups.append(group)
            processed.add(i)
    
    console.print(f"[green]Found {len(duplicate_groups)} groups of similar entries[/green]")
    return duplicate_groups

def choose_representative(entries, group):
    """Choose the representative entry from a group of duplicates"""
    # Default strategy: keep the newest, most detailed entry
    grouped_entries = [entries[i] for i in group]
    
    # Sort by last modified (newest first) and then by size (largest first)
    sorted_entries = sorted(
        zip(group, grouped_entries),
        key=lambda x: (x[1]['last_modified'], x[1]['size']),
        reverse=True
    )
    
    # Return the index of the chosen representative
    return sorted_entries[0][0]

def remove_duplicates(entries, duplicate_groups, dry_run=False):
    """Remove duplicate entries, keeping one representative from each group"""
    files_to_remove = []
    
    for group in duplicate_groups:
        keep_idx = choose_representative(entries, group)
        
        for idx in group:
            if idx != keep_idx:
                files_to_remove.append(entries[idx]['path'])
    
    console.print(f"[blue]Found {len(files_to_remove)} files to remove[/blue]")
    
    if dry_run:
        console.print("[yellow]Dry run - no files will be removed[/yellow]")
        return files_to_remove
    
    # Remove duplicate files
    for file_path in tqdm(files_to_remove, desc="Removing duplicates"):
        try:
            os.remove(file_path)
        except Exception as e:
            console.print(f"[red]Error removing {file_path}: {e}[/red]")
    
    console.print(f"[green]Successfully removed {len(files_to_remove)} duplicate files[/green]")
    return files_to_remove

def show_summary_table(entries, removed_files):
    """Display a summary table of deduplication results"""
    table = Table(title="SKR Deduplication Summary")
    
    table.add_column("Metric", style="cyan")
    table.add_column("Count", style="green")
    
    total_entries = len(entries)
    removed_count = len(removed_files)
    remaining_count = total_entries - removed_count
    
    table.add_row("Total SKR entries", str(total_entries))
    table.add_row("Duplicate entries removed", str(removed_count))
    table.add_row("Remaining unique entries", str(remaining_count))
    table.add_row("Reduction percentage", f"{(removed_count/total_entries*100):.2f}%")
    
    console.print(table)

def main():
    """Main execution function"""
    console.print("[bold blue]SKR Deduplication Tool[/bold blue]")
    console.print("Compacting SKR memory by removing redundant entries\n")
    
    # Parse arguments
    import argparse
    parser = argparse.ArgumentParser(description="Deduplicate SKR entries")
    parser.add_argument("--dry-run", action="store_true", help="Perform a dry run without removing files")
    parser.add_argument("--threshold", type=float, help="Similarity threshold (0.0-1.0)")
    parser.add_argument("--no-backup", action="store_true", help="Skip backup creation")
    args = parser.parse_args()
    
    # Load configuration
    config = load_config()
    
    # Override config with command line args
    if args.threshold:
        config['similarity_threshold'] = args.threshold
    
    skr_path = Path(config['skr_path'])
    
    # Validate SKR path
    if not skr_path.exists() or not skr_path.is_dir():
        console.print(f"[red]Error: SKR path {skr_path} does not exist or is not a directory[/red]")
        return 1
    
    # Create backup if enabled
    if config.get('backup_enabled', True) and not args.no_backup:
        backup_path = create_backup(skr_path)
        console.print(f"[green]Backup created at {backup_path}[/green]")
    
    # Load all SKR entries
    entries = load_skr_entries(skr_path)
    
    if len(entries) == 0:
        console.print("[yellow]No SKR entries found. Exiting.[/yellow]")
        return 0
    
    # Compute embeddings for each entry
    embeddings = compute_embeddings(entries, config)
    
    # Find duplicate entries
    duplicate_groups = find_duplicates(embeddings, config['similarity_threshold'])
    
    # Remove duplicates
    removed_files = remove_duplicates(entries, duplicate_groups, dry_run=args.dry_run)
    
    # Show summary
    show_summary_table(entries, removed_files)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())