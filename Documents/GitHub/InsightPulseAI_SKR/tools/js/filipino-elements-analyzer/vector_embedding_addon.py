#!/usr/bin/env python3
"""
Vector Embedding Add-on for Filipino Elements Analysis

This module adds vector embedding capabilities to the Filipino Elements Analysis system,
enabling semantic similarity search and clustering of campaigns based on their
Filipino cultural elements.

Requirements:
- sentence-transformers
- faiss-cpu (or faiss-gpu if GPU is available)
- numpy
- sqlite3
- matplotlib
- scikit-learn
"""

import os
import sqlite3
import numpy as np
import matplotlib.pyplot as plt
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
import json
import argparse
import pickle
from datetime import datetime
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("FAISS not available. Install with: pip install faiss-cpu")

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("Sentence Transformers not available. Install with: pip install sentence-transformers")

# Paths
DB_PATH = '/Users/tbwa/ph_awards.db'
OUTPUT_DIR = '/Users/tbwa/ph_awards_reports'
VECTOR_DB_PATH = os.path.join(OUTPUT_DIR, 'vector_db')

# Ensure directories exist
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(VECTOR_DB_PATH, exist_ok=True)

class FilipinoElementsVectorizer:
    """Vectorizer for Filipino cultural elements data"""
    
    def __init__(self, db_path=DB_PATH, model_name='paraphrase-multilingual-MiniLM-L12-v2'):
        """Initialize the vectorizer with database path and model"""
        self.db_path = db_path
        self.model_name = model_name
        
        # Check dependencies
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise ImportError("sentence-transformers is required. Install with: pip install sentence-transformers")
        
        # Load embedding model
        print(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        
        # Connect to database
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        
        # Initialize FAISS index
        self.index = None
        self.campaign_ids = []
        self.campaign_data = []
    
    def close(self):
        """Close database connection"""
        if hasattr(self, 'conn') and self.conn:
            self.conn.close()
    
    def get_campaign_data(self):
        """Get campaign data with Filipino elements"""
        # First, check table structure to identify correct column names
        cursor = self.conn.cursor()
        
        # Get table info for PH_Awards_Campaigns
        cursor.execute("PRAGMA table_info(PH_Awards_Campaigns)")
        campaign_columns = {column[1]: column[0] for column in cursor.fetchall()}
        
        # Adjust query based on actual column names
        id_col = 'id' if 'id' in campaign_columns else 'campaign_id'
        name_col = 'campaign_name' if 'campaign_name' in campaign_columns else 'name'
        
        # Build query with correct column names
        query = f"""
        SELECT 
            c.{id_col} as campaign_id, 
            c.{name_col} as campaign_name, 
            c.brand, 
            c.year,
            f.*,
            b.roi,
            b.sales_lift,
            b.brand_lift,
            p.award_count
        FROM PH_Awards_Campaigns c
        JOIN PH_Filipino_Metrics f ON c.{id_col} = f.campaign_id
        LEFT JOIN PH_Business_Impact b ON c.{id_col} = b.campaign_id
        LEFT JOIN PH_Awards_Performance p ON c.{id_col} = p.campaign_id
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        # Convert to list of dictionaries
        return [dict(row) for row in rows]
    
    def create_campaign_descriptions(self, campaigns):
        """Create textual descriptions of campaigns based on Filipino elements"""
        descriptions = []
        
        for campaign in campaigns:
            filipino_elements = []
            
            # Get column names that start with 'has_'
            element_cols = [col for col in campaign.keys() if col.startswith('has_') and campaign[col] == 1]
            
            # Create description of Filipino elements
            for col in element_cols:
                element_name = col.replace('has_', '').replace('_', ' ')
                filipino_elements.append(element_name)
            
            # Create campaign description
            description = f"Campaign '{campaign['campaign_name']}' by {campaign.get('brand', 'Unknown Brand')} "
            
            if filipino_elements:
                description += f"featuring Filipino elements: {', '.join(filipino_elements)}. "
            else:
                description += "with no specific Filipino elements. "
            
            description += f"Filipino index: {campaign.get('filipino_index', 0)}. "
            
            if campaign.get('roi') is not None:
                description += f"ROI: {campaign['roi']}. "
            
            if campaign.get('award_count') is not None:
                description += f"Awards: {campaign['award_count']}."
            
            descriptions.append(description)
        
        return descriptions
    
    def build_vector_index(self):
        """Build vector index from campaign data"""
        # Get campaign data
        campaigns = self.get_campaign_data()
        self.campaign_data = campaigns
        
        if not campaigns:
            print("No campaign data found. Check database path and table structure.")
            return None
            
        print(f"Retrieved {len(campaigns)} campaigns from database.")
        
        # Save campaign IDs for lookup
        self.campaign_ids = [c['campaign_id'] for c in campaigns]
        
        # Create campaign descriptions
        descriptions = self.create_campaign_descriptions(campaigns)
        
        # Generate embeddings
        print(f"Generating embeddings for {len(descriptions)} campaigns...")
        embeddings = self.model.encode(descriptions, show_progress_bar=True)
        
        # Normalize embeddings (L2 norm)
        faiss.normalize_L2(embeddings)
        
        # Create FAISS index
        embedding_dim = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(embedding_dim)  # Inner product index (cosine similarity for normalized vectors)
        self.index.add(embeddings)
        
        # Save index and data
        self.save_vector_db()
        
        print(f"Vector index built successfully with {len(descriptions)} campaigns.")
        return embeddings
    
    def save_vector_db(self):
        """Save vector database to disk"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save FAISS index
        index_path = os.path.join(VECTOR_DB_PATH, f"filipino_elements_index_{timestamp}.faiss")
        if FAISS_AVAILABLE:
            faiss.write_index(self.index, index_path)
        
        # Save campaign IDs and data
        with open(os.path.join(VECTOR_DB_PATH, f"campaign_ids_{timestamp}.pkl"), 'wb') as f:
            pickle.dump(self.campaign_ids, f)
        
        with open(os.path.join(VECTOR_DB_PATH, f"campaign_data_{timestamp}.json"), 'w') as f:
            json.dump(self.campaign_data, f, indent=2)
        
        # Save latest paths
        with open(os.path.join(VECTOR_DB_PATH, "latest_paths.json"), 'w') as f:
            json.dump({
                "index_path": index_path,
                "campaign_ids_path": os.path.join(VECTOR_DB_PATH, f"campaign_ids_{timestamp}.pkl"),
                "campaign_data_path": os.path.join(VECTOR_DB_PATH, f"campaign_data_{timestamp}.json"),
                "timestamp": timestamp
            }, f, indent=2)
        
        print(f"Vector database saved to {VECTOR_DB_PATH}")
    
    def load_vector_db(self):
        """Load vector database from disk"""
        # Check for latest paths
        latest_paths_file = os.path.join(VECTOR_DB_PATH, "latest_paths.json")
        if not os.path.exists(latest_paths_file):
            print("No saved vector database found. Please build index first.")
            return False
        
        # Load paths
        with open(latest_paths_file, 'r') as f:
            paths = json.load(f)
        
        # Load FAISS index
        if FAISS_AVAILABLE and os.path.exists(paths["index_path"]):
            self.index = faiss.read_index(paths["index_path"])
        else:
            print(f"FAISS index not found at {paths['index_path']}")
            return False
        
        # Load campaign IDs
        if os.path.exists(paths["campaign_ids_path"]):
            with open(paths["campaign_ids_path"], 'rb') as f:
                self.campaign_ids = pickle.load(f)
        else:
            print(f"Campaign IDs not found at {paths['campaign_ids_path']}")
            return False
        
        # Load campaign data
        if os.path.exists(paths["campaign_data_path"]):
            with open(paths["campaign_data_path"], 'r') as f:
                self.campaign_data = json.load(f)
        else:
            print(f"Campaign data not found at {paths['campaign_data_path']}")
            return False
        
        print(f"Vector database loaded from {VECTOR_DB_PATH} (timestamp: {paths['timestamp']})")
        return True
    
    def find_similar_campaigns(self, query, k=5):
        """Find campaigns similar to the query"""
        # Check if index is loaded
        if self.index is None:
            loaded = self.load_vector_db()
            if not loaded:
                print("Building new vector index...")
                self.build_vector_index()
        
        # Generate query embedding
        query_embedding = self.model.encode([query])
        
        # Normalize query embedding
        faiss.normalize_L2(query_embedding)
        
        # Search similar campaigns
        distances, indices = self.index.search(query_embedding, k)
        
        # Get results
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.campaign_ids):
                campaign_id = self.campaign_ids[idx]
                campaign = next((c for c in self.campaign_data if c['campaign_id'] == campaign_id), None)
                
                if campaign:
                    results.append({
                        'campaign_id': campaign_id,
                        'campaign_name': campaign['campaign_name'],
                        'brand': campaign.get('brand', 'Unknown'),
                        'year': campaign.get('year', 'Unknown'),
                        'filipino_index': campaign.get('filipino_index', 0),
                        'roi': campaign.get('roi'),
                        'award_count': campaign.get('award_count'),
                        'similarity_score': float(distances[0][i])
                    })
        
        return results
    
    def cluster_campaigns(self, n_clusters=5):
        """Cluster campaigns based on their Filipino elements"""
        # Check if index is loaded
        if self.index is None:
            loaded = self.load_vector_db()
            if not loaded:
                print("Building new vector index...")
                self.build_vector_index()
        
        # Get all vectors from the index
        if not FAISS_AVAILABLE:
            print("FAISS not available. Cannot extract vectors from index.")
            return None
        
        # Extract vectors from FAISS index
        n_vectors = self.index.ntotal
        embedding_dim = self.index.d
        vectors = np.zeros((n_vectors, embedding_dim), dtype=np.float32)
        
        for i in range(n_vectors):
            vectors[i] = self.index.reconstruct(i)
        
        # Apply t-SNE for dimensionality reduction
        print("Applying t-SNE for dimensionality reduction...")
        tsne = TSNE(n_components=2, random_state=42, perplexity=min(30, max(5, n_vectors // 10)))
        vectors_2d = tsne.fit_transform(vectors)
        
        # Apply K-means clustering
        print(f"Clustering campaigns into {n_clusters} clusters...")
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(vectors)
        
        # Create cluster visualization
        plt.figure(figsize=(12, 8))
        
        # Plot points colored by cluster
        for cluster_id in range(n_clusters):
            cluster_points = vectors_2d[clusters == cluster_id]
            plt.scatter(
                cluster_points[:, 0], 
                cluster_points[:, 1], 
                label=f'Cluster {cluster_id+1}',
                alpha=0.7
            )
        
        plt.title('Campaign Clustering by Filipino Elements')
        plt.xlabel('t-SNE Component 1')
        plt.ylabel('t-SNE Component 2')
        plt.legend()
        plt.tight_layout()
        
        # Save plot
        plot_path = os.path.join(OUTPUT_DIR, 'campaign_clusters.png')
        plt.savefig(plot_path)
        print(f"Cluster visualization saved to {plot_path}")
        
        # Generate cluster analysis
        cluster_analysis = self.analyze_clusters(clusters, n_clusters)
        
        return {
            'clusters': clusters.tolist(),
            'vectors_2d': vectors_2d.tolist(),
            'cluster_analysis': cluster_analysis,
            'plot_path': plot_path
        }
    
    def analyze_clusters(self, clusters, n_clusters):
        """Analyze the characteristics of each cluster"""
        cluster_analysis = []
        
        for cluster_id in range(n_clusters):
            # Get campaigns in this cluster
            cluster_indices = np.where(clusters == cluster_id)[0]
            cluster_campaign_ids = [self.campaign_ids[i] for i in cluster_indices if i < len(self.campaign_ids)]
            cluster_campaigns = [c for c in self.campaign_data if c['campaign_id'] in cluster_campaign_ids]
            
            if not cluster_campaigns:
                continue
            
            # Calculate metrics for this cluster
            avg_filipino_index = sum(c.get('filipino_index', 0) for c in cluster_campaigns) / len(cluster_campaigns)
            
            # Count Filipino elements
            element_counts = {}
            for campaign in cluster_campaigns:
                for key in campaign.keys():
                    if key.startswith('has_') and campaign[key] == 1:
                        element_name = key.replace('has_', '')
                        element_counts[element_name] = element_counts.get(element_name, 0) + 1
            
            # Sort elements by frequency
            top_elements = sorted(element_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            
            # Calculate average ROI if available
            roi_values = [c['roi'] for c in cluster_campaigns if c.get('roi') is not None]
            avg_roi = sum(roi_values) / len(roi_values) if roi_values else None
            
            # Calculate average award count if available
            award_counts = [c['award_count'] for c in cluster_campaigns if c.get('award_count') is not None]
            avg_award_count = sum(award_counts) / len(award_counts) if award_counts else None
            
            # Sample campaigns
            sample_campaigns = sorted(
                [(c['campaign_name'], c.get('brand', 'Unknown'), c.get('year', 'Unknown')) for c in cluster_campaigns],
                key=lambda x: str(x[2]),
                reverse=True
            )[:5]
            
            cluster_analysis.append({
                'cluster_id': cluster_id,
                'size': len(cluster_campaigns),
                'avg_filipino_index': avg_filipino_index,
                'top_elements': top_elements,
                'avg_roi': avg_roi,
                'avg_award_count': avg_award_count,
                'sample_campaigns': sample_campaigns
            })
        
        return cluster_analysis
    
    def generate_embedding_report(self):
        """Generate a report on the vector embeddings and clustering"""
        # Check if index is loaded
        if self.index is None:
            loaded = self.load_vector_db()
            if not loaded:
                print("Building new vector index...")
                self.build_vector_index()
        
        # Perform clustering
        clustering_results = self.cluster_campaigns()
        
        if not clustering_results:
            print("Clustering failed. Cannot generate report.")
            return None
        
        # Create markdown report
        markdown = f"# Filipino Elements Vector Analysis Report\n\n"
        markdown += f"*Generated on {datetime.now().strftime('%Y-%m-%d')}*\n\n"
        
        # Summary
        markdown += f"## Summary\n\n"
        markdown += f"- Total campaigns analyzed: {len(self.campaign_data)}\n"
        markdown += f"- Embedding model: {self.model_name}\n"
        markdown += f"- Embedding dimensions: {self.index.d}\n"
        markdown += f"- Clustering method: K-means\n\n"
        
        # Clustering visualization
        markdown += f"## Campaign Clustering\n\n"
        markdown += f"![Campaign Clusters](./campaign_clusters.png)\n\n"
        
        # Cluster analysis
        markdown += f"## Cluster Analysis\n\n"
        
        for cluster in clustering_results['cluster_analysis']:
            markdown += f"### Cluster {cluster['cluster_id'] + 1} ({cluster['size']} campaigns)\n\n"
            markdown += f"- Average Filipino Index: {cluster['avg_filipino_index']:.2f}\n"
            
            markdown += f"- Top Filipino Elements:\n"
            for element, count in cluster['top_elements']:
                markdown += f"  - {element.replace('_', ' ')}: {count} campaigns ({count/cluster['size']*100:.1f}%)\n"
            
            if cluster['avg_roi'] is not None:
                markdown += f"- Average ROI: {cluster['avg_roi']:.2f}\n"
            
            if cluster['avg_award_count'] is not None:
                markdown += f"- Average Award Count: {cluster['avg_award_count']:.2f}\n"
            
            markdown += f"- Sample Campaigns:\n"
            for name, brand, year in cluster['sample_campaigns']:
                markdown += f"  - {name} ({brand}, {year})\n"
            
            markdown += f"\n"
        
        # Save report
        report_path = os.path.join(OUTPUT_DIR, 'filipino_elements_vector_analysis.md')
        with open(report_path, 'w') as f:
            f.write(markdown)
        
        print(f"Vector analysis report saved to {report_path}")
        return report_path

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Filipino Elements Vector Analysis Tool")
    parser.add_argument('--build', action='store_true', help="Build vector index")
    parser.add_argument('--analyze', action='store_true', help="Generate vector analysis report")
    parser.add_argument('--clusters', type=int, default=5, help="Number of clusters (default: 5)")
    parser.add_argument('--search', type=str, help="Search for similar campaigns")
    parser.add_argument('--db', type=str, default=DB_PATH, help="Path to SQLite database")
    parser.add_argument('--model', type=str, default='paraphrase-multilingual-MiniLM-L12-v2', 
                      help="Sentence transformer model name")
    
    args = parser.parse_args()
    
    # Create vectorizer
    vectorizer = FilipinoElementsVectorizer(db_path=args.db, model_name=args.model)
    
    try:
        if args.build:
            # Build vector index
            vectorizer.build_vector_index()
        
        if args.search:
            # Search for similar campaigns
            results = vectorizer.find_similar_campaigns(args.search)
            
            if results:
                print(f"\nCampaigns similar to: '{args.search}'")
                print("=" * 50)
                for i, result in enumerate(results):
                    print(f"{i+1}. {result['campaign_name']} ({result['brand']}, {result['year']})")
                    print(f"   Filipino Index: {result['filipino_index']:.2f}")
                    if result['roi'] is not None:
                        print(f"   ROI: {result['roi']:.2f}")
                    if result['award_count'] is not None:
                        print(f"   Awards: {result['award_count']}")
                    print(f"   Similarity Score: {result['similarity_score']:.4f}")
                    print()
            else:
                print("No similar campaigns found.")
        
        if args.analyze:
            # Set number of clusters
            vectorizer.cluster_campaigns(n_clusters=args.clusters)
            
            # Generate report
            report_path = vectorizer.generate_embedding_report()
            
            if report_path:
                print(f"Report generated: {report_path}")
                # Open the report on macOS
                if os.name == 'posix' and os.uname().sysname == 'Darwin':
                    os.system(f"open {report_path}")
        
        # If no action specified, show help
        if not (args.build or args.search or args.analyze):
            parser.print_help()
    
    finally:
        vectorizer.close()

if __name__ == "__main__":
    main()