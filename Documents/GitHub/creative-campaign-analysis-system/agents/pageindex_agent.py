#!/usr/bin/env python3
"""
TBWA Creative Campaign Analysis System - PageIndex Agent
ColPali-style semantic indexing and cataloging agent

Environment-aware, repo-contained Azure-native processing agent.
"""

import os
import sys
import json
import yaml
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import uuid

# Azure SDK imports
import pyodbc
from azure.identity import DefaultAzureCredential, ClientSecretCredential
from azure.storage.blob import BlobServiceClient
from openai import AzureOpenAI

# Text processing imports
import hashlib
import re
from dataclasses import dataclass

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

@dataclass
class ChunkMetadata:
    """Metadata for a semantic chunk"""
    chunk_id: str
    file_id: str
    filepath: str
    title: str
    text_snippet: str
    tags: List[str]
    visual_quality_score: float
    semantic_topics: List[str]
    mood_label: str
    chunk_index: int
    content_type: str
    confidence_score: float

class PageIndexAgent:
    """
    ColPali-style PageIndex Agent for TBWA Creative Campaign Analysis
    
    Features:
    - Per-file semantic chunking
    - Vector embedding and indexing
    - Quality and mood classification
    - Azure-native integration
    - Repo-contained processing
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize the PageIndex Agent with Azure configuration"""
        self.project_root = PROJECT_ROOT
        self.config_path = config_path or self.project_root / "config" / "azure_config.yaml"
        
        # Load configuration
        self.config = self._load_config()
        
        # Initialize logging
        self._setup_logging()
        
        # Initialize Azure clients
        self.sql_connection = None
        self.openai_client = None
        self.blob_client = None
        
        # Processing state
        self.processing_stats = {
            "files_processed": 0,
            "chunks_created": 0,
            "errors": 0,
            "start_time": None
        }
        
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file with environment variable substitution"""
        try:
            with open(self.config_path, 'r') as f:
                config_content = f.read()
                
            # Replace environment variables
            import os
            for key, value in os.environ.items():
                config_content = config_content.replace(f"${{{key}}}", value)
                
            config = yaml.safe_load(config_content)
            return config
        except Exception as e:
            raise RuntimeError(f"Failed to load configuration from {self.config_path}: {e}")
    
    def _setup_logging(self):
        """Setup logging configuration"""
        log_level = getattr(logging, self.config.get("logging", {}).get("level", "INFO").upper())
        
        # Create logs directory if it doesn't exist
        log_dir = self.project_root / "logs"
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler(log_dir / "pageindex_agent.log")
            ]
        )
        
        self.logger = logging.getLogger("PageIndexAgent")
        
    async def initialize_clients(self):
        """Initialize Azure clients for SQL, OpenAI, and Storage"""
        try:
            # Initialize SQL connection
            self._init_sql_connection()
            
            # Initialize OpenAI client
            self._init_openai_client()
            
            # Initialize Blob storage client (if needed)
            self._init_blob_client()
            
            self.logger.info("Successfully initialized all Azure clients")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Azure clients: {e}")
            raise
    
    def _init_sql_connection(self):
        """Initialize Azure SQL connection"""
        sql_config = self.config["azure"]["sql"]
        
        # Build connection string
        connection_string = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={sql_config['server']};"
            f"DATABASE={sql_config['database']};"
            f"UID={sql_config['username']};"
            f"PWD={sql_config['password']};"
            f"Encrypt=yes;"
            f"TrustServerCertificate=no;"
            f"Connection Timeout=30;"
        )
        
        self.sql_connection = pyodbc.connect(connection_string)
        self.logger.info(f"Connected to Azure SQL: {sql_config['server']}")
    
    def _init_openai_client(self):
        """Initialize Azure OpenAI client"""
        openai_config = self.config["azure"]["openai"]
        
        self.openai_client = AzureOpenAI(
            api_key=openai_config["api_key"],
            api_version=openai_config["api_version"],
            azure_endpoint=openai_config["endpoint"]
        )
        
        self.logger.info(f"Connected to Azure OpenAI: {openai_config['endpoint']}")
    
    def _init_blob_client(self):
        """Initialize Azure Blob Storage client"""
        if "storage" in self.config["azure"]:
            storage_config = self.config["azure"]["storage"]
            self.blob_client = BlobServiceClient.from_connection_string(
                storage_config["connection_string"]
            )
            self.logger.info(f"Connected to Azure Storage: {storage_config['account_name']}")
    
    async def process_file(self, filepath: str, campaign_name: str = None, client_name: str = None) -> str:
        """
        Process a single file for semantic indexing
        
        Args:
            filepath: Path to the file (relative to project root)
            campaign_name: Optional campaign name
            client_name: Optional client name
            
        Returns:
            file_id: UUID of the processed file
        """
        self.logger.info(f"Processing file: {filepath}")
        
        # Ensure filepath is relative to project root
        full_path = self.project_root / filepath
        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {full_path}")
        
        # Generate file ID
        file_id = str(uuid.uuid4())
        
        try:
            # 1. Extract file metadata
            metadata = self._extract_file_metadata(full_path, file_id, campaign_name, client_name)
            
            # 2. Insert file metadata
            self._insert_file_metadata(metadata)
            
            # 3. Extract and chunk content
            chunks = await self._extract_and_chunk_content(full_path, file_id)
            
            # 4. Process each chunk
            for i, chunk in enumerate(chunks):
                chunk_metadata = await self._process_chunk(chunk, file_id, filepath, i)
                self._insert_chunk_metadata(chunk_metadata)
            
            # 5. Update file processing status
            self._update_file_status(file_id, "completed", len(chunks))
            
            # 6. Update campaign insights
            if campaign_name:
                self._update_campaign_insights(campaign_name, client_name)
            
            self.processing_stats["files_processed"] += 1
            self.processing_stats["chunks_created"] += len(chunks)
            
            self.logger.info(f"Successfully processed file {filepath}: {len(chunks)} chunks created")
            return file_id
            
        except Exception as e:
            self.logger.error(f"Error processing file {filepath}: {e}")
            self._update_file_status(file_id, "failed", 0, str(e))
            self.processing_stats["errors"] += 1
            raise
    
    def _extract_file_metadata(self, file_path: Path, file_id: str, campaign_name: str = None, client_name: str = None) -> Dict[str, Any]:
        """Extract metadata from file"""
        stat = file_path.stat()
        
        # Determine file type
        suffix = file_path.suffix.lower()
        if suffix in ['.pdf', '.docx', '.pptx', '.txt']:
            file_type = 'document'
        elif suffix in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            file_type = 'image'
        elif suffix in ['.mp4', '.mov', '.avi', '.webm']:
            file_type = 'video'
        else:
            file_type = 'other'
        
        return {
            "file_id": file_id,
            "original_filename": file_path.name,
            "filepath": str(file_path.relative_to(self.project_root)),
            "file_size": stat.st_size,
            "mime_type": self._get_mime_type(suffix),
            "campaign_name": campaign_name,
            "client_name": client_name,
            "file_type": file_type,
            "processing_status": "processing"
        }
    
    def _get_mime_type(self, suffix: str) -> str:
        """Get MIME type from file suffix"""
        mime_types = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.txt': 'text/plain',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.avi': 'video/x-msvideo',
            '.webm': 'video/webm'
        }
        return mime_types.get(suffix, 'application/octet-stream')
    
    async def _extract_and_chunk_content(self, file_path: Path, file_id: str) -> List[str]:
        """Extract content from file and split into semantic chunks"""
        
        # Extract text content based on file type
        if file_path.suffix.lower() == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        elif file_path.suffix.lower() == '.pdf':
            content = self._extract_pdf_content(file_path)
        elif file_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            content = await self._extract_image_content(file_path)
        else:
            # For other file types, use filename and basic metadata as content
            content = f"File: {file_path.name}\nType: {file_path.suffix}\nSize: {file_path.stat().st_size} bytes"
        
        # Split into semantic chunks
        chunks = self._semantic_chunk_text(content)
        
        self.logger.info(f"Extracted {len(chunks)} chunks from {file_path.name}")
        return chunks
    
    def _extract_pdf_content(self, file_path: Path) -> str:
        """Extract text content from PDF file"""
        try:
            import PyPDF2
            
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                content = ""
                for page in reader.pages:
                    content += page.extract_text() + "\n"
            return content
        except ImportError:
            self.logger.warning("PyPDF2 not available, using filename as content")
            return f"PDF file: {file_path.name}"
        except Exception as e:
            self.logger.error(f"Error extracting PDF content: {e}")
            return f"PDF file: {file_path.name} (extraction failed)"
    
    async def _extract_image_content(self, file_path: Path) -> str:
        """Extract content description from image using Azure OpenAI Vision"""
        try:
            # For now, return basic image description
            # In production, you would use Azure OpenAI Vision API
            return f"Image file: {file_path.name}\nType: Visual content\nFormat: {file_path.suffix}"
        except Exception as e:
            self.logger.error(f"Error extracting image content: {e}")
            return f"Image file: {file_path.name}"
    
    def _semantic_chunk_text(self, content: str) -> List[str]:
        """Split text into semantic chunks"""
        chunk_size = self.config["pageindex"]["chunk_size"]
        chunk_overlap = self.config["pageindex"]["chunk_overlap"]
        
        # Simple chunking by paragraphs and sentences
        paragraphs = content.split('\n\n')
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            if len(current_chunk) + len(paragraph) < chunk_size:
                current_chunk += paragraph + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = paragraph + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    async def _process_chunk(self, chunk_text: str, file_id: str, filepath: str, chunk_index: int) -> ChunkMetadata:
        """Process a single chunk: embedding, classification, and metadata extraction"""
        
        chunk_id = str(uuid.uuid4())
        
        # Extract title (first line or meaningful snippet)
        title = self._extract_chunk_title(chunk_text)
        
        # Generate embedding
        embedding = await self._generate_embedding(chunk_text)
        
        # Classify mood and quality
        mood_label = await self._classify_mood(chunk_text)
        quality_score = await self._assess_quality(chunk_text)
        
        # Extract semantic topics
        topics = await self._extract_topics(chunk_text)
        
        # Generate tags
        tags = await self._generate_tags(chunk_text)
        
        # Determine content type
        content_type = self._determine_content_type(chunk_text)
        
        return ChunkMetadata(
            chunk_id=chunk_id,
            file_id=file_id,
            filepath=filepath,
            title=title,
            text_snippet=chunk_text[:500],  # Limit snippet size
            tags=tags,
            visual_quality_score=quality_score,
            semantic_topics=topics,
            mood_label=mood_label,
            chunk_index=chunk_index,
            content_type=content_type,
            confidence_score=0.8  # Placeholder
        )
    
    def _extract_chunk_title(self, chunk_text: str) -> str:
        """Extract a meaningful title from chunk text"""
        lines = chunk_text.split('\n')
        first_line = lines[0].strip()
        
        # If first line is short and meaningful, use as title
        if len(first_line) < 100 and first_line:
            return first_line
        
        # Otherwise, use first few words
        words = chunk_text.split()
        return ' '.join(words[:10]) + ('...' if len(words) > 10 else '')
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text using Azure OpenAI"""
        try:
            response = self.openai_client.embeddings.create(
                model=self.config["pageindex"]["embeddings"]["model"],
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            self.logger.error(f"Error generating embedding: {e}")
            # Return zero vector as fallback
            return [0.0] * self.config["pageindex"]["embeddings"]["dimensions"]
    
    async def _classify_mood(self, text: str) -> str:
        """Classify the mood/tone of the text using Azure OpenAI"""
        try:
            mood_labels = self.config["pageindex"]["classification"]["mood_labels"]
            
            prompt = f"""
            Analyze the mood and tone of the following text and classify it as one of these options:
            {', '.join(mood_labels)}
            
            Text: {text[:500]}
            
            Return only the mood label, nothing else.
            """
            
            response = self.openai_client.chat.completions.create(
                model=self.config["azure"]["openai"]["chat_model"],
                messages=[{"role": "user", "content": prompt}],
                max_tokens=50,
                temperature=0.1
            )
            
            mood = response.choices[0].message.content.strip().lower()
            
            # Validate mood is in allowed list
            if mood in [m.lower() for m in mood_labels]:
                return mood
            else:
                return "corporate"  # Default fallback
                
        except Exception as e:
            self.logger.error(f"Error classifying mood: {e}")
            return "corporate"  # Default fallback
    
    async def _assess_quality(self, text: str) -> float:
        """Assess the quality score of the content"""
        try:
            # Simple quality assessment based on text characteristics
            quality_factors = {
                "length": min(len(text) / 500, 1.0),  # Longer is better, up to a point
                "complexity": len(set(text.split())) / len(text.split()) if text.split() else 0,  # Vocabulary diversity
                "structure": 1.0 if '\n' in text else 0.5,  # Has structure
                "clarity": 1.0 - (text.count('?') + text.count('...')) / len(text.split())  # Fewer uncertainties
            }
            
            return sum(quality_factors.values()) / len(quality_factors)
            
        except Exception as e:
            self.logger.error(f"Error assessing quality: {e}")
            return 0.5  # Default moderate quality
    
    async def _extract_topics(self, text: str) -> List[str]:
        """Extract semantic topics from text"""
        try:
            prompt = f"""
            Extract 3-5 key semantic topics from the following text. 
            Return them as a comma-separated list of short phrases.
            
            Text: {text[:500]}
            
            Topics:
            """
            
            response = self.openai_client.chat.completions.create(
                model=self.config["azure"]["openai"]["chat_model"],
                messages=[{"role": "user", "content": prompt}],
                max_tokens=100,
                temperature=0.1
            )
            
            topics_text = response.choices[0].message.content.strip()
            topics = [topic.strip() for topic in topics_text.split(',')]
            
            return topics[:5]  # Limit to 5 topics
            
        except Exception as e:
            self.logger.error(f"Error extracting topics: {e}")
            return ["general"]  # Default fallback
    
    async def _generate_tags(self, text: str) -> List[str]:
        """Generate descriptive tags for the content"""
        try:
            # Extract keywords and create tags
            words = re.findall(r'\b\w+\b', text.lower())
            
            # Simple tag extraction based on word frequency
            word_freq = {}
            for word in words:
                if len(word) > 3:  # Skip short words
                    word_freq[word] = word_freq.get(word, 0) + 1
            
            # Get top words as tags
            top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
            tags = [word for word, freq in top_words if freq > 1]
            
            return tags[:5]  # Limit to 5 tags
            
        except Exception as e:
            self.logger.error(f"Error generating tags: {e}")
            return ["content"]  # Default fallback
    
    def _determine_content_type(self, text: str) -> str:
        """Determine the type of content based on text analysis"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['chart', 'graph', 'data', 'statistics']):
            return 'infographic'
        elif any(word in text_lower for word in ['quote', 'said', 'statement']):
            return 'quote_card'
        elif any(word in text_lower for word in ['product', 'features', 'specifications']):
            return 'product_shot'
        elif any(word in text_lower for word in ['logo', 'brand', 'identity']):
            return 'logo_treatment'
        else:
            return 'text_overlay'
    
    def _insert_file_metadata(self, metadata: Dict[str, Any]):
        """Insert file metadata into database"""
        cursor = self.sql_connection.cursor()
        
        sql = """
        INSERT INTO fileMetadata 
        (file_id, original_filename, filepath, file_size, mime_type, campaign_name, 
         client_name, file_type, processing_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        cursor.execute(sql, (
            metadata["file_id"],
            metadata["original_filename"],
            metadata["filepath"],
            metadata["file_size"],
            metadata["mime_type"],
            metadata["campaign_name"],
            metadata["client_name"],
            metadata["file_type"],
            metadata["processing_status"]
        ))
        
        self.sql_connection.commit()
        cursor.close()
    
    def _insert_chunk_metadata(self, chunk: ChunkMetadata):
        """Insert chunk metadata into database"""
        cursor = self.sql_connection.cursor()
        
        # Insert into pageIndex table
        sql = """
        INSERT INTO pageIndex 
        (chunk_id, file_id, filepath, title, text_snippet, tags, visual_quality_score,
         semantic_topics, mood_label, chunk_index, content_type, confidence_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        cursor.execute(sql, (
            chunk.chunk_id,
            chunk.file_id,
            chunk.filepath,
            chunk.title,
            chunk.text_snippet,
            json.dumps(chunk.tags),
            chunk.visual_quality_score,
            json.dumps(chunk.semantic_topics),
            chunk.mood_label,
            chunk.chunk_index,
            chunk.content_type,
            chunk.confidence_score
        ))
        
        self.sql_connection.commit()
        cursor.close()
    
    def _update_file_status(self, file_id: str, status: str, total_chunks: int, error_message: str = None):
        """Update file processing status"""
        cursor = self.sql_connection.cursor()
        
        if error_message:
            sql = """
            UPDATE fileMetadata 
            SET processing_status = ?, total_chunks = ?, processed_at = GETUTCDATE()
            WHERE file_id = ?
            """
            cursor.execute(sql, (status, total_chunks, file_id))
        else:
            sql = """
            UPDATE fileMetadata 
            SET processing_status = ?, total_chunks = ?, processed_at = GETUTCDATE()
            WHERE file_id = ?
            """
            cursor.execute(sql, (status, total_chunks, file_id))
        
        self.sql_connection.commit()
        cursor.close()
    
    def _update_campaign_insights(self, campaign_name: str, client_name: str):
        """Update or create campaign-level insights"""
        cursor = self.sql_connection.cursor()
        
        # Calculate aggregated metrics
        sql = """
        SELECT 
            COUNT(DISTINCT fm.file_id) as total_files,
            COUNT(pi.chunk_id) as total_chunks,
            AVG(pi.visual_quality_score) as avg_quality,
            STRING_AGG(pi.mood_label, ', ') as moods
        FROM fileMetadata fm
        LEFT JOIN pageIndex pi ON fm.file_id = pi.file_id
        WHERE fm.campaign_name = ?
        """
        
        cursor.execute(sql, (campaign_name,))
        result = cursor.fetchone()
        
        if result:
            total_files, total_chunks, avg_quality, moods = result
            
            # Get dominant mood
            if moods:
                mood_counts = {}
                for mood in moods.split(', '):
                    mood_counts[mood] = mood_counts.get(mood, 0) + 1
                dominant_mood = max(mood_counts.items(), key=lambda x: x[1])[0]
            else:
                dominant_mood = "corporate"
            
            # Upsert campaign insights
            upsert_sql = """
            MERGE campaignInsights AS target
            USING (VALUES (?, ?, ?, ?, ?, ?)) AS source 
                (campaign_name, client_name, total_files, total_chunks, avg_quality_score, dominant_mood)
            ON target.campaign_name = source.campaign_name
            WHEN MATCHED THEN
                UPDATE SET 
                    client_name = source.client_name,
                    total_files = source.total_files,
                    total_chunks = source.total_chunks,
                    avg_quality_score = source.avg_quality_score,
                    dominant_mood = source.dominant_mood,
                    updated_at = GETUTCDATE()
            WHEN NOT MATCHED THEN
                INSERT (campaign_name, client_name, total_files, total_chunks, avg_quality_score, dominant_mood)
                VALUES (source.campaign_name, source.client_name, source.total_files, source.total_chunks, 
                       source.avg_quality_score, source.dominant_mood);
            """
            
            cursor.execute(upsert_sql, (
                campaign_name, client_name, total_files or 0, total_chunks or 0,
                avg_quality or 0.0, dominant_mood
            ))
            
            self.sql_connection.commit()
        
        cursor.close()
    
    async def search_semantic(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search for semantically similar content"""
        try:
            # Generate embedding for query
            query_embedding = await self._generate_embedding(query)
            
            # For now, use text search (in production, use vector similarity)
            cursor = self.sql_connection.cursor()
            
            sql = """
            SELECT TOP (?)
                pi.chunk_id,
                pi.file_id,
                fm.original_filename,
                fm.campaign_name,
                pi.title,
                pi.text_snippet,
                pi.visual_quality_score,
                pi.mood_label,
                pi.confidence_score
            FROM pageIndex pi
            INNER JOIN fileMetadata fm ON pi.file_id = fm.file_id
            WHERE pi.text_snippet LIKE ? OR pi.title LIKE ?
            ORDER BY pi.visual_quality_score DESC
            """
            
            search_term = f"%{query}%"
            cursor.execute(sql, (limit, search_term, search_term))
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    "chunk_id": row[0],
                    "file_id": row[1],
                    "filename": row[2],
                    "campaign_name": row[3],
                    "title": row[4],
                    "snippet": row[5],
                    "quality_score": row[6],
                    "mood": row[7],
                    "confidence": row[8]
                })
            
            cursor.close()
            return results
            
        except Exception as e:
            self.logger.error(f"Error in semantic search: {e}")
            return []
    
    def get_processing_stats(self) -> Dict[str, Any]:
        """Get current processing statistics"""
        return self.processing_stats.copy()
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on all systems"""
        health_status = {
            "timestamp": datetime.utcnow().isoformat(),
            "status": "healthy",
            "checks": {}
        }
        
        # Check SQL connection
        try:
            cursor = self.sql_connection.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            health_status["checks"]["sql"] = "healthy"
        except Exception as e:
            health_status["checks"]["sql"] = f"error: {e}"
            health_status["status"] = "unhealthy"
        
        # Check OpenAI connection
        try:
            test_embedding = await self._generate_embedding("test")
            if len(test_embedding) > 0:
                health_status["checks"]["openai"] = "healthy"
            else:
                health_status["checks"]["openai"] = "error: empty embedding"
                health_status["status"] = "unhealthy"
        except Exception as e:
            health_status["checks"]["openai"] = f"error: {e}"
            health_status["status"] = "unhealthy"
        
        return health_status

# CLI Interface
async def main():
    """Main CLI interface for PageIndex Agent"""
    import argparse
    
    parser = argparse.ArgumentParser(description="TBWA PageIndex Agent - ColPali-style semantic indexing")
    parser.add_argument("--file", help="Process a specific file")
    parser.add_argument("--campaign", help="Campaign name")
    parser.add_argument("--client", help="Client name")
    parser.add_argument("--search", help="Search query")
    parser.add_argument("--health", action="store_true", help="Perform health check")
    parser.add_argument("--config", help="Path to configuration file")
    
    args = parser.parse_args()
    
    # Initialize agent
    agent = PageIndexAgent(config_path=args.config)
    await agent.initialize_clients()
    
    try:
        if args.health:
            # Health check
            status = await agent.health_check()
            print(json.dumps(status, indent=2))
            
        elif args.search:
            # Semantic search
            results = await agent.search_semantic(args.search)
            print(json.dumps(results, indent=2))
            
        elif args.file:
            # Process file
            file_id = await agent.process_file(
                filepath=args.file,
                campaign_name=args.campaign,
                client_name=args.client
            )
            print(f"File processed successfully. File ID: {file_id}")
            
            # Print stats
            stats = agent.get_processing_stats()
            print(f"Processing stats: {json.dumps(stats, indent=2)}")
            
        else:
            parser.print_help()
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())