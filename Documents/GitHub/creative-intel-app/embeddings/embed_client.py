import os
from typing import List, Dict, Any, Optional, Union
import numpy as np
from openai import OpenAI
import pinecone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import yaml

class EmbeddingClient:
    def __init__(self, config_path: str = "../config/app.config.yaml"):
        """Initialize the embedding client with configuration."""
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.provider = self.config['features']['rag']['provider']
        self.dimension = self.config['features']['rag']['dimension']
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        if self.provider == 'pinecone':
            self._init_pinecone()
        else:
            self._init_pgvector()

    def _init_pinecone(self):
        """Initialize Pinecone client."""
        pinecone.init(
            api_key=os.getenv('PINECONE_API_KEY'),
            environment=os.getenv('PINECONE_ENVIRONMENT')
        )
        self.index_name = os.getenv('PINECONE_INDEX_NAME')
        if self.index_name not in pinecone.list_indexes():
            pinecone.create_index(
                name=self.index_name,
                dimension=self.dimension,
                metric='cosine'
            )
        self.index = pinecone.Index(self.index_name)

    def _init_pgvector(self):
        """Initialize pgvector connection."""
        self.engine = create_engine(os.getenv('DATABASE_URL'))
        self.Session = sessionmaker(bind=self.engine)

    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding for a text using OpenAI."""
        response = await self.openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding

    async def store_embedding(
        self,
        text: str,
        metadata: Dict[str, Any],
        namespace: Optional[str] = None
    ) -> str:
        """Store embedding with metadata."""
        embedding = await self.get_embedding(text)
        
        if self.provider == 'pinecone':
            return self._store_pinecone(embedding, metadata, namespace)
        else:
            return self._store_pgvector(embedding, metadata)

    def _store_pinecone(
        self,
        embedding: List[float],
        metadata: Dict[str, Any],
        namespace: Optional[str]
    ) -> str:
        """Store embedding in Pinecone."""
        vector_id = metadata.get('id', str(np.random.randint(0, 1000000)))
        self.index.upsert(
            vectors=[(vector_id, embedding, metadata)],
            namespace=namespace
        )
        return vector_id

    def _store_pgvector(
        self,
        embedding: List[float],
        metadata: Dict[str, Any]
    ) -> str:
        """Store embedding in pgvector."""
        with self.Session() as session:
            query = text("""
                INSERT INTO feature_vectors 
                (asset_id, feature_type, embedding, metadata)
                VALUES (:asset_id, :feature_type, :embedding, :metadata)
                RETURNING id
            """)
            result = session.execute(
                query,
                {
                    'asset_id': metadata['asset_id'],
                    'feature_type': metadata['feature_type'],
                    'embedding': embedding,
                    'metadata': metadata
                }
            )
            session.commit()
            return str(result.scalar())

    async def search_similar(
        self,
        query: str,
        top_k: int = 5,
        namespace: Optional[str] = None,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar embeddings."""
        query_embedding = await self.get_embedding(query)
        
        if self.provider == 'pinecone':
            return self._search_pinecone(query_embedding, top_k, namespace, filter)
        else:
            return self._search_pgvector(query_embedding, top_k, filter)

    def _search_pinecone(
        self,
        query_embedding: List[float],
        top_k: int,
        namespace: Optional[str],
        filter: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Search similar vectors in Pinecone."""
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            namespace=namespace,
            filter=filter,
            include_metadata=True
        )
        return [
            {
                'id': match.id,
                'score': match.score,
                'metadata': match.metadata
            }
            for match in results.matches
        ]

    def _search_pgvector(
        self,
        query_embedding: List[float],
        top_k: int,
        filter: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Search similar vectors in pgvector."""
        with self.Session() as session:
            query = text("""
                SELECT id, asset_id, feature_type, metadata,
                       1 - (embedding <=> :query_embedding) as similarity
                FROM feature_vectors
                WHERE (:filter)::jsonb @> metadata
                ORDER BY embedding <=> :query_embedding
                LIMIT :top_k
            """)
            results = session.execute(
                query,
                {
                    'query_embedding': query_embedding,
                    'filter': filter or {},
                    'top_k': top_k
                }
            )
            return [
                {
                    'id': str(row.id),
                    'score': float(row.similarity),
                    'metadata': row.metadata
                }
                for row in results
            ]

    def delete_embedding(
        self,
        vector_id: str,
        namespace: Optional[str] = None
    ) -> bool:
        """Delete an embedding by ID."""
        if self.provider == 'pinecone':
            self.index.delete(ids=[vector_id], namespace=namespace)
            return True
        else:
            with self.Session() as session:
                query = text("DELETE FROM feature_vectors WHERE id = :id")
                result = session.execute(query, {'id': vector_id})
                session.commit()
                return result.rowcount > 0 