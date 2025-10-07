#!/usr/bin/env python3
"""
session_indexer.py - Index and search SKR sessions

This script manages the SKR session index, providing search capabilities
and maintaining a searchable index of all session data.
"""

import os
import sys
import json
import yaml
import glob
import time
import argparse
from datetime import datetime
from pathlib import Path
import shutil

# Version matching Pulser version
VERSION = "1.1.1"

# Default paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
SKR_DIR = os.path.join(REPO_ROOT, "SKR")
SESSIONS_DIR = os.path.join(SKR_DIR, "sessions")
INDEX_FILE = os.path.join(SESSIONS_DIR, "index.json")
INBOX_DIR = os.path.join(SKR_DIR, "inbox")


def ensure_dirs():
    """Ensure all required directories exist"""
    os.makedirs(SESSIONS_DIR, exist_ok=True)


def load_index():
    """Load the session index, creating if it doesn't exist"""
    if not os.path.exists(INDEX_FILE):
        return {"sessions": [], "last_updated": datetime.now().isoformat()}
        
    try:
        with open(INDEX_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {"sessions": [], "last_updated": datetime.now().isoformat()}


def save_index(index):
    """Save the session index"""
    with open(INDEX_FILE, "w") as f:
        json.dump(index, f, indent=2)


def get_session_metadata(session_dir):
    """Extract metadata from a session directory"""
    metadata_file = os.path.join(session_dir, "metadata.yml")
    content_file = os.path.join(session_dir, "content.txt")
    summary_file = os.path.join(session_dir, "summary.md")
    
    metadata = {}
    content_preview = ""
    summary = ""
    
    # Extract metadata
    if os.path.exists(metadata_file):
        try:
            with open(metadata_file, "r") as f:
                metadata = yaml.safe_load(f)
        except Exception as e:
            print(f"Error loading metadata from {metadata_file}: {e}")
    
    # Get content preview
    if os.path.exists(content_file):
        try:
            with open(content_file, "r") as f:
                content = f.read()
                content_preview = content[:500] + "..." if len(content) > 500 else content
        except Exception as e:
            print(f"Error loading content from {content_file}: {e}")
    
    # Get summary
    if os.path.exists(summary_file):
        try:
            with open(summary_file, "r") as f:
                summary = f.read()
        except Exception as e:
            print(f"Error loading summary from {summary_file}: {e}")
    
    # Create session record
    session_id = os.path.basename(session_dir)
    session_date = metadata.get("date", "")
    if not session_date and "pulser_session_" in session_id:
        # Try to extract date from directory name
        try:
            timestamp = session_id.split("_")[-1]
            dt = datetime.strptime(timestamp, "%Y%m%d%H%M%S")
            session_date = dt.isoformat()
        except (ValueError, IndexError):
            session_date = datetime.now().isoformat()
    
    return {
        "id": session_id,
        "title": metadata.get("title", f"Session {session_id}"),
        "date": session_date,
        "path": session_dir,
        "summary": summary,
        "content_preview": content_preview,
        "tags": metadata.get("tags", []),
        "model": metadata.get("model", "unknown")
    }


def update_index():
    """Update the session index with any new sessions"""
    index = load_index()
    existing_ids = {session["id"] for session in index["sessions"]}
    
    # Process inbox directory for new sessions
    inbox_dirs = [d for d in glob.glob(os.path.join(INBOX_DIR, "pulser_session_*")) if os.path.isdir(d)]
    
    for inbox_dir in inbox_dirs:
        session_id = os.path.basename(inbox_dir)
        if session_id not in existing_ids:
            # Create a more permanent home for the session
            target_dir = os.path.join(SESSIONS_DIR, session_id)
            if not os.path.exists(target_dir):
                shutil.copytree(inbox_dir, target_dir)
                print(f"Moved session {session_id} to permanent storage")
    
    # Find any sessions that aren't in the index yet
    session_dirs = [d for d in glob.glob(os.path.join(SESSIONS_DIR, "*")) if os.path.isdir(d)]
    
    new_sessions = []
    for session_dir in session_dirs:
        session_id = os.path.basename(session_dir)
        if session_id not in existing_ids:
            metadata = get_session_metadata(session_dir)
            new_sessions.append(metadata)
    
    # Add new sessions to the index
    if new_sessions:
        index["sessions"].extend(new_sessions)
        index["last_updated"] = datetime.now().isoformat()
        save_index(index)
        print(f"Added {len(new_sessions)} new sessions to the index")
    else:
        print("No new sessions to index")
    
    return index


def search_sessions(query, limit=10):
    """Search sessions by keyword"""
    index = load_index()
    results = []
    
    for session in index["sessions"]:
        score = 0
        query_lower = query.lower()
        
        # Search in title
        if query_lower in session.get("title", "").lower():
            score += 10
        
        # Search in content preview
        if query_lower in session.get("content_preview", "").lower():
            score += 5
        
        # Search in summary
        if query_lower in session.get("summary", "").lower():
            score += 7
        
        # Search in tags
        for tag in session.get("tags", []):
            if query_lower in tag.lower():
                score += 15
        
        if score > 0:
            results.append((session, score))
    
    # Sort by score (descending)
    results.sort(key=lambda x: x[1], reverse=True)
    
    # Limit results
    return results[:limit]


def get_latest_session():
    """Get the most recent session"""
    index = load_index()
    
    if not index["sessions"]:
        return None
    
    # Sort by date (descending)
    sessions = sorted(index["sessions"], 
                      key=lambda x: x.get("date", ""), 
                      reverse=True)
    
    return sessions[0] if sessions else None


def save_last_session(session_data):
    """Save the session data to the last session file"""
    last_session_file = os.path.join(REPO_ROOT, "logs", "pulser_last_session.json")
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(last_session_file), exist_ok=True)
    
    with open(last_session_file, "w") as f:
        json.dump(session_data, f, indent=2)


def load_last_session():
    """Load the last session data"""
    last_session_file = os.path.join(REPO_ROOT, "logs", "pulser_last_session.json")
    
    if not os.path.exists(last_session_file):
        return None
    
    try:
        with open(last_session_file, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return None


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Pulser Session Indexer")
    parser.add_argument("--update", "-u", action="store_true", help="Update the session index")
    parser.add_argument("--search", "-s", help="Search for sessions by keyword")
    parser.add_argument("--latest", "-l", action="store_true", help="Get the latest session")
    parser.add_argument("--limit", "-n", type=int, default=10, help="Limit search results")
    
    args = parser.parse_args()
    
    ensure_dirs()
    
    if args.update:
        update_index()
        return 0
    
    if args.search:
        results = search_sessions(args.search, args.limit)
        
        if not results:
            print(f"No sessions found matching '{args.search}'")
            return 0
        
        print(f"Found {len(results)} sessions matching '{args.search}':")
        for i, (session, score) in enumerate(results, 1):
            print(f"{i}. {session['title']} ({session['date']})")
            if session.get("summary"):
                print(f"   Summary: {session['summary'].split('\n')[0]}")
            print(f"   Score: {score}, Path: {session['path']}")
            print()
        
        return 0
    
    if args.latest:
        latest = get_latest_session()
        
        if not latest:
            print("No sessions found")
            return 0
        
        print(f"Latest session: {latest['title']} ({latest['date']})")
        if latest.get("summary"):
            print(f"Summary: {latest['summary']}")
        print(f"Path: {latest['path']}")
        
        # Save to last session file
        save_last_session(latest)
        
        return 0
    
    # Default: show stats
    index = load_index()
    print(f"Session index contains {len(index['sessions'])} sessions")
    print(f"Last updated: {index['last_updated']}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())