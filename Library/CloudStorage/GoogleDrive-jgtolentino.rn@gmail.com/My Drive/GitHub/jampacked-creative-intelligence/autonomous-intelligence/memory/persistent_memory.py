#!/usr/bin/env python3
"""
Persistent Memory System with Vector/SQL Store and TTL
Implements short-term scratch, long-term storage, and garbage collection
"""

import asyncio
import logging
import json
import sqlite3
import numpy as np
from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
import uuid
import pickle
from abc import ABC, abstractmethod

from utils.structured_logger import get_logger, trace_context, PerformanceTimer
from utils.cost_guard import BudgetType, spend_budget

logger = get_logger(__name__)


class MemoryType(Enum):
    """Types of memory storage"""
    SCRATCH = "scratch"      # Very short-term working memory
    SHORT_TERM = "short_term"  # Session-based memory
    LONG_TERM = "long_term"   # Persistent cross-session memory
    EPISODIC = "episodic"     # Specific experiences/events
    SEMANTIC = "semantic"     # Facts and knowledge
    PROCEDURAL = "procedural" # How-to knowledge and skills


@dataclass
class Memory:
    """Individual memory unit"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    type: MemoryType = MemoryType.SHORT_TERM
    content: Any = None
    embedding: Optional[np.ndarray] = None
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    accessed_at: datetime = field(default_factory=datetime.now)
    access_count: int = 0
    importance: float = 0.5  # 0-1 scale
    confidence: float = 0.8  # 0-1 scale
    
    # Context
    source: Optional[str] = None
    goal_id: Optional[str] = None
    trace_id: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    
    # TTL and lifecycle
    ttl_seconds: Optional[int] = None  # None means no expiry
    expires_at: Optional[datetime] = None
    archived: bool = False
    
    def __post_init__(self):
        if self.ttl_seconds:
            self.expires_at = self.created_at + timedelta(seconds=self.ttl_seconds)
    
    def is_expired(self) -> bool:
        """Check if memory has expired"""
        if not self.expires_at:
            return False
        return datetime.now() > self.expires_at
    
    def access(self):
        """Update access tracking"""
        self.accessed_at = datetime.now()
        self.access_count += 1
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        data = asdict(self)
        # Handle numpy array
        if self.embedding is not None:
            data['embedding'] = self.embedding.tolist()
        # Handle datetime
        for key in ['created_at', 'accessed_at', 'expires_at']:
            if data.get(key):
                data[key] = data[key].isoformat() if isinstance(data[key], datetime) else data[key]
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Memory':
        """Create from dictionary"""
        # Handle datetime
        for key in ['created_at', 'accessed_at', 'expires_at']:
            if data.get(key) and isinstance(data[key], str):
                data[key] = datetime.fromisoformat(data[key])
        # Handle embedding
        if data.get('embedding') and isinstance(data['embedding'], list):
            data['embedding'] = np.array(data['embedding'])
        # Handle enum
        if data.get('type') and isinstance(data['type'], str):
            data['type'] = MemoryType(data['type'])
        return cls(**data)


class MemoryStore(ABC):
    """Abstract base class for memory storage backends"""
    
    @abstractmethod
    async def store(self, memory: Memory) -> bool:
        """Store a memory"""
        pass
    
    @abstractmethod
    async def retrieve(self, memory_id: str) -> Optional[Memory]:
        """Retrieve a memory by ID"""
        pass
    
    @abstractmethod
    async def search(self, query: Dict[str, Any], limit: int = 10) -> List[Memory]:
        """Search memories"""
        pass
    
    @abstractmethod
    async def delete(self, memory_id: str) -> bool:
        """Delete a memory"""
        pass
    
    @abstractmethod
    async def cleanup_expired(self) -> int:
        """Clean up expired memories"""
        pass


class SQLMemoryStore(MemoryStore):
    """SQL-based memory storage with full-text search"""
    
    def __init__(self, db_path: str = "./memories.db"):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """Initialize database schema"""
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                content TEXT,
                embedding BLOB,
                created_at TEXT NOT NULL,
                accessed_at TEXT NOT NULL,
                access_count INTEGER DEFAULT 0,
                importance REAL DEFAULT 0.5,
                confidence REAL DEFAULT 0.8,
                source TEXT,
                goal_id TEXT,
                trace_id TEXT,
                tags TEXT,
                ttl_seconds INTEGER,
                expires_at TEXT,
                archived INTEGER DEFAULT 0,
                FULLTEXT(content, tags)
            )
        """)
        
        # Create indices
        conn.execute("CREATE INDEX IF NOT EXISTS idx_type ON memories(type)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_goal ON memories(goal_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_expires ON memories(expires_at)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_importance ON memories(importance)")
        
        conn.commit()
        conn.close()
    
    async def store(self, memory: Memory) -> bool:
        """Store a memory in SQL database"""
        try:
            conn = sqlite3.connect(self.db_path)
            
            # Prepare data
            data = memory.to_dict()
            data['tags'] = json.dumps(data.get('tags', []))
            data['type'] = data['type'].value if isinstance(data['type'], MemoryType) else data['type']
            
            # Store embedding as binary
            if memory.embedding is not None:
                data['embedding'] = pickle.dumps(memory.embedding)
            
            # Insert or update
            conn.execute("""
                INSERT OR REPLACE INTO memories 
                (id, type, content, embedding, created_at, accessed_at, access_count,
                 importance, confidence, source, goal_id, trace_id, tags, 
                 ttl_seconds, expires_at, archived)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data['id'], data['type'], json.dumps(data.get('content')),
                data.get('embedding'), data['created_at'], data['accessed_at'],
                data['access_count'], data['importance'], data['confidence'],
                data.get('source'), data.get('goal_id'), data.get('trace_id'),
                data['tags'], data.get('ttl_seconds'), data.get('expires_at'),
                1 if data.get('archived') else 0
            ))
            
            conn.commit()
            conn.close()
            
            logger.debug("Memory stored", memory_id=memory.id, type=memory.type.value)
            return True
            
        except Exception as e:
            logger.error("Failed to store memory", error=str(e))
            return False
    
    async def retrieve(self, memory_id: str) -> Optional[Memory]:
        """Retrieve a memory by ID"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            
            cursor = conn.execute(
                "SELECT * FROM memories WHERE id = ? AND archived = 0", 
                (memory_id,)
            )
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return self._row_to_memory(row)
            return None
            
        except Exception as e:
            logger.error("Failed to retrieve memory", error=str(e))
            return None
    
    async def search(self, query: Dict[str, Any], limit: int = 10) -> List[Memory]:
        """Search memories with various criteria"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            
            # Build query
            conditions = ["archived = 0"]
            params = []
            
            if query.get('type'):
                conditions.append("type = ?")
                params.append(query['type'].value if isinstance(query['type'], MemoryType) else query['type'])
            
            if query.get('goal_id'):
                conditions.append("goal_id = ?")
                params.append(query['goal_id'])
            
            if query.get('tags'):
                # Search in tags JSON
                tag_conditions = []
                for tag in query['tags']:
                    tag_conditions.append("tags LIKE ?")
                    params.append(f'%"{tag}"%')
                if tag_conditions:
                    conditions.append(f"({' OR '.join(tag_conditions)})")
            
            if query.get('text'):
                # Full-text search
                conditions.append("content MATCH ?")
                params.append(query['text'])
            
            if query.get('min_importance'):
                conditions.append("importance >= ?")
                params.append(query['min_importance'])
            
            # Build and execute query
            sql = f"""
                SELECT * FROM memories 
                WHERE {' AND '.join(conditions)}
                ORDER BY importance DESC, accessed_at DESC
                LIMIT ?
            """
            params.append(limit)
            
            cursor = conn.execute(sql, params)
            rows = cursor.fetchall()
            conn.close()
            
            memories = [self._row_to_memory(row) for row in rows]
            
            # Update access tracking
            for memory in memories:
                memory.access()
                await self.store(memory)
            
            return memories
            
        except Exception as e:
            logger.error("Failed to search memories", error=str(e))
            return []
    
    async def delete(self, memory_id: str) -> bool:
        """Delete a memory (soft delete by archiving)"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.execute(
                "UPDATE memories SET archived = 1 WHERE id = ?",
                (memory_id,)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error("Failed to delete memory", error=str(e))
            return False
    
    async def cleanup_expired(self) -> int:
        """Clean up expired memories"""
        try:
            conn = sqlite3.connect(self.db_path)
            
            # Get count before cleanup
            cursor = conn.execute(
                "SELECT COUNT(*) FROM memories WHERE expires_at IS NOT NULL AND expires_at < ? AND archived = 0",
                (datetime.now().isoformat(),)
            )
            count = cursor.fetchone()[0]
            
            # Archive expired memories
            conn.execute(
                "UPDATE memories SET archived = 1 WHERE expires_at IS NOT NULL AND expires_at < ? AND archived = 0",
                (datetime.now().isoformat(),)
            )
            
            conn.commit()
            conn.close()
            
            if count > 0:
                logger.info("Cleaned up expired memories", count=count)
            
            return count
            
        except Exception as e:
            logger.error("Failed to cleanup expired memories", error=str(e))
            return 0
    
    def _row_to_memory(self, row: sqlite3.Row) -> Memory:
        """Convert database row to Memory object"""
        data = dict(row)
        
        # Parse JSON fields
        if data.get('content'):
            data['content'] = json.loads(data['content'])
        if data.get('tags'):
            data['tags'] = json.loads(data['tags'])
        
        # Parse embedding
        if data.get('embedding'):
            data['embedding'] = pickle.loads(data['embedding'])
        
        # Convert archived flag
        data['archived'] = bool(data.get('archived'))
        
        return Memory.from_dict(data)


class VectorMemoryStore(MemoryStore):
    """Vector-based memory storage for similarity search"""
    
    def __init__(self, dimension: int = 768):
        self.dimension = dimension
        self.memories: Dict[str, Memory] = {}
        self.embeddings: Dict[str, np.ndarray] = {}
        self.index = None  # Would use FAISS or similar in production
    
    async def store(self, memory: Memory) -> bool:
        """Store memory with vector embedding"""
        if memory.embedding is None:
            logger.warning("Memory has no embedding, cannot store in vector store")
            return False
        
        self.memories[memory.id] = memory
        self.embeddings[memory.id] = memory.embedding
        
        # Update index (in production, would use incremental indexing)
        self._rebuild_index()
        
        return True
    
    async def retrieve(self, memory_id: str) -> Optional[Memory]:
        """Retrieve memory by ID"""
        memory = self.memories.get(memory_id)
        if memory:
            memory.access()
        return memory
    
    async def search(self, query: Dict[str, Any], limit: int = 10) -> List[Memory]:
        """Search by vector similarity"""
        if 'embedding' not in query:
            logger.warning("No embedding in query for vector search")
            return []
        
        query_embedding = query['embedding']
        if isinstance(query_embedding, list):
            query_embedding = np.array(query_embedding)
        
        # Find similar embeddings
        similarities = []
        for mem_id, embedding in self.embeddings.items():
            if mem_id in self.memories and not self.memories[mem_id].is_expired():
                similarity = self._cosine_similarity(query_embedding, embedding)
                similarities.append((mem_id, similarity))
        
        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Get top results
        results = []
        for mem_id, similarity in similarities[:limit]:
            memory = self.memories[mem_id]
            memory.access()
            results.append(memory)
        
        return results
    
    async def delete(self, memory_id: str) -> bool:
        """Delete memory from vector store"""
        if memory_id in self.memories:
            del self.memories[memory_id]
            if memory_id in self.embeddings:
                del self.embeddings[memory_id]
            self._rebuild_index()
            return True
        return False
    
    async def cleanup_expired(self) -> int:
        """Clean up expired memories"""
        expired_ids = [
            mem_id for mem_id, memory in self.memories.items()
            if memory.is_expired()
        ]
        
        for mem_id in expired_ids:
            await self.delete(mem_id)
        
        return len(expired_ids)
    
    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between vectors"""
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    
    def _rebuild_index(self):
        """Rebuild vector index (placeholder for real implementation)"""
        # In production, would use FAISS, Annoy, or similar
        pass


class PersistentMemorySystem:
    """
    Complete persistent memory system with multiple stores and TTL management
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        
        # Initialize stores
        self.scratch_store = {}  # Simple dict for scratch memory
        self.sql_store = SQLMemoryStore(self.config.get('sql_db_path', './memories.db'))
        self.vector_store = VectorMemoryStore(self.config.get('embedding_dim', 768))
        
        # TTL configurations (in seconds)
        self.default_ttls = {
            MemoryType.SCRATCH: 300,      # 5 minutes
            MemoryType.SHORT_TERM: 3600,  # 1 hour
            MemoryType.LONG_TERM: None,   # No expiry
            MemoryType.EPISODIC: 86400,   # 24 hours
            MemoryType.SEMANTIC: None,    # No expiry
            MemoryType.PROCEDURAL: None   # No expiry
        }
        
        # Memory consolidation settings
        self.consolidation_threshold = self.config.get('consolidation_threshold', 5)
        self.importance_threshold = self.config.get('importance_threshold', 0.7)
        
        # Background tasks
        self._cleanup_task = None
        self._consolidation_task = None
        
        # Metrics
        self.total_memories_stored = 0
        self.total_memories_retrieved = 0
        self.total_memories_expired = 0
        
        logger.info("🧠 PersistentMemorySystem initialized")
    
    async def start(self):
        """Start background tasks"""
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        self._consolidation_task = asyncio.create_task(self._consolidation_loop())
        logger.info("Memory system background tasks started")
    
    async def stop(self):
        """Stop background tasks"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
        if self._consolidation_task:
            self._consolidation_task.cancel()
        
        # Wait for tasks to complete
        tasks = [t for t in [self._cleanup_task, self._consolidation_task] if t]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def store_memory(self, content: Any, memory_type: MemoryType,
                          embedding: Optional[np.ndarray] = None,
                          metadata: Optional[Dict[str, Any]] = None) -> Memory:
        """Store a new memory"""
        # Create memory object
        memory = Memory(
            type=memory_type,
            content=content,
            embedding=embedding,
            ttl_seconds=metadata.get('ttl') or self.default_ttls.get(memory_type),
            **{k: v for k, v in (metadata or {}).items() if k != 'ttl'}
        )
        
        # Store based on type
        if memory_type == MemoryType.SCRATCH:
            self.scratch_store[memory.id] = memory
        else:
            # Store in SQL
            await self.sql_store.store(memory)
            
            # Also store in vector if embedding provided
            if embedding is not None:
                await self.vector_store.store(memory)
        
        self.total_memories_stored += 1
        
        logger.info("Memory stored", 
                   memory_id=memory.id,
                   type=memory_type.value,
                   has_embedding=embedding is not None)
        
        return memory
    
    async def retrieve_memory(self, memory_id: str) -> Optional[Memory]:
        """Retrieve a specific memory"""
        # Check scratch first
        if memory_id in self.scratch_store:
            memory = self.scratch_store[memory_id]
            if not memory.is_expired():
                memory.access()
                self.total_memories_retrieved += 1
                return memory
        
        # Check SQL store
        memory = await self.sql_store.retrieve(memory_id)
        if memory:
            self.total_memories_retrieved += 1
            return memory
        
        # Check vector store
        memory = await self.vector_store.retrieve(memory_id)
        if memory:
            self.total_memories_retrieved += 1
            return memory
        
        return None
    
    async def search_memories(self, query: Dict[str, Any], 
                            memory_types: Optional[List[MemoryType]] = None,
                            limit: int = 10) -> List[Memory]:
        """Search memories across stores"""
        results = []
        
        # Search scratch if included
        if not memory_types or MemoryType.SCRATCH in memory_types:
            for memory in self.scratch_store.values():
                if self._matches_query(memory, query) and not memory.is_expired():
                    results.append(memory)
        
        # Search SQL store
        if not memory_types or any(mt != MemoryType.SCRATCH for mt in memory_types):
            sql_results = await self.sql_store.search(query, limit)
            results.extend(sql_results)
        
        # Search vector store if embedding provided
        if query.get('embedding') is not None:
            vector_results = await self.vector_store.search(query, limit)
            
            # Merge results, avoiding duplicates
            existing_ids = {m.id for m in results}
            for memory in vector_results:
                if memory.id not in existing_ids:
                    results.append(memory)
        
        # Sort by relevance/importance
        results.sort(key=lambda m: (m.importance, -m.access_count), reverse=True)
        
        self.total_memories_retrieved += len(results[:limit])
        
        return results[:limit]
    
    async def consolidate_memories(self):
        """Consolidate short-term memories into long-term"""
        logger.info("Starting memory consolidation")
        
        # Find frequently accessed short-term memories
        candidates = await self.sql_store.search({
            'type': MemoryType.SHORT_TERM,
            'min_importance': self.importance_threshold
        }, limit=100)
        
        consolidated = 0
        for memory in candidates:
            if memory.access_count >= self.consolidation_threshold:
                # Convert to long-term memory
                memory.type = MemoryType.LONG_TERM
                memory.ttl_seconds = None
                memory.expires_at = None
                memory.importance = min(memory.importance * 1.2, 1.0)  # Boost importance
                
                await self.sql_store.store(memory)
                consolidated += 1
        
        if consolidated > 0:
            logger.info("Memories consolidated", count=consolidated)
        
        return consolidated
    
    async def summarize_and_compress(self, time_window: timedelta = timedelta(days=7)):
        """Summarize and compress old memories"""
        cutoff = datetime.now() - time_window
        
        # Find old episodic memories
        old_memories = await self.sql_store.search({
            'type': MemoryType.EPISODIC
        }, limit=1000)
        
        # Group by goal/context
        grouped = {}
        for memory in old_memories:
            if memory.created_at < cutoff:
                key = memory.goal_id or 'general'
                if key not in grouped:
                    grouped[key] = []
                grouped[key].append(memory)
        
        # Create summaries
        for key, memories in grouped.items():
            if len(memories) > 10:
                # Create summary (would use LLM in production)
                summary_content = {
                    'type': 'summary',
                    'period': f"{cutoff.isoformat()} to {datetime.now().isoformat()}",
                    'source_count': len(memories),
                    'key_points': self._extract_key_points(memories)
                }
                
                # Store as semantic memory
                await self.store_memory(
                    content=summary_content,
                    memory_type=MemoryType.SEMANTIC,
                    metadata={
                        'source': 'memory_compression',
                        'goal_id': key,
                        'importance': 0.8
                    }
                )
                
                # Archive original memories
                for memory in memories:
                    memory.archived = True
                    await self.sql_store.store(memory)
        
        logger.info("Memory compression completed", groups=len(grouped))
    
    async def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory system statistics"""
        stats = {
            'total_stored': self.total_memories_stored,
            'total_retrieved': self.total_memories_retrieved,
            'total_expired': self.total_memories_expired,
            'by_type': {},
            'scratch_count': len(self.scratch_store)
        }
        
        # Count by type
        for memory_type in MemoryType:
            count = len(await self.sql_store.search({'type': memory_type}, limit=10000))
            stats['by_type'][memory_type.value] = count
        
        return stats
    
    def _matches_query(self, memory: Memory, query: Dict[str, Any]) -> bool:
        """Check if memory matches search query"""
        if query.get('type') and memory.type != query['type']:
            return False
        
        if query.get('goal_id') and memory.goal_id != query['goal_id']:
            return False
        
        if query.get('tags'):
            if not any(tag in memory.tags for tag in query['tags']):
                return False
        
        if query.get('min_importance') and memory.importance < query['min_importance']:
            return False
        
        return True
    
    def _extract_key_points(self, memories: List[Memory]) -> List[str]:
        """Extract key points from memories (placeholder)"""
        # In production, would use LLM to summarize
        return [f"Summary of {len(memories)} memories"]
    
    async def _cleanup_loop(self):
        """Background task for cleaning expired memories"""
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes
                
                # Clean scratch
                expired = []
                for mem_id, memory in self.scratch_store.items():
                    if memory.is_expired():
                        expired.append(mem_id)
                
                for mem_id in expired:
                    del self.scratch_store[mem_id]
                    self.total_memories_expired += 1
                
                # Clean SQL store
                sql_expired = await self.sql_store.cleanup_expired()
                self.total_memories_expired += sql_expired
                
                # Clean vector store
                vector_expired = await self.vector_store.cleanup_expired()
                self.total_memories_expired += vector_expired
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in cleanup loop", error=str(e))
    
    async def _consolidation_loop(self):
        """Background task for memory consolidation"""
        while True:
            try:
                await asyncio.sleep(3600)  # Run every hour
                
                # Consolidate memories
                await self.consolidate_memories()
                
                # Compress old memories weekly
                if datetime.now().hour == 2:  # Run at 2 AM
                    await self.summarize_and_compress()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in consolidation loop", error=str(e))


# Factory function
def create_persistent_memory_system(config: Optional[Dict[str, Any]] = None) -> PersistentMemorySystem:
    """Create and configure a persistent memory system"""
    default_config = {
        'sql_db_path': './memories.db',
        'embedding_dim': 768,
        'consolidation_threshold': 5,
        'importance_threshold': 0.7
    }
    
    if config:
        default_config.update(config)
    
    return PersistentMemorySystem(default_config)