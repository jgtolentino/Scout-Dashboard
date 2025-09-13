#!/usr/bin/env python3
"""
Demo Vector Data Generator

This script creates a sample dataset for the Filipino Elements Vector Analysis tool
to demonstrate its functionality without requiring the actual database.
"""

import os
import json
import numpy as np
import argparse
import pickle
from datetime import datetime
import matplotlib.pyplot as plt
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
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
OUTPUT_DIR = '/Users/tbwa/ph_awards_reports'
VECTOR_DB_PATH = os.path.join(OUTPUT_DIR, 'vector_db')

# Ensure directories exist
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(VECTOR_DB_PATH, exist_ok=True)

# Helper for JSON serialization
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

# Sample Filipino elements
FILIPINO_ELEMENTS = [
    'sari_sari', 'jeepney', 'palengke', 'fiesta', 'barong_filipiniana',
    'filipino_food', 'adobo', 'filipino_celebrities', 'pinoy_humor',
    'bahay_kubo', 'videoke_karaoke', 'sundo_hatid', 'tambay',
    'balikbayan_box', 'family_values', 'resilience', 'street_culture'
]

# Sample brands
BRANDS = [
    'Jollibee', 'Smart Communications', 'Globe Telecom', 'San Miguel',
    'Cebu Pacific', 'BDO', 'Bench', 'PLDT', 'Nestle Philippines',
    'Max\'s Restaurant', 'Magnolia', 'Tanduay', 'National Book Store',
    'Mercury Drug', 'Chowking', 'Red Ribbon', 'Greenwich', 'SM', 'Ayala'
]

# Generate sample campaign data
def generate_sample_data(num_campaigns=40):
    """Generate sample campaign data with Filipino elements"""
    campaigns = []
    
    # Create a distribution for Filipino elements
    # Some elements are more common than others
    element_probabilities = {
        'family_values': 0.6,
        'filipino_food': 0.5,
        'sari_sari': 0.4,
        'jeepney': 0.35,
        'pinoy_humor': 0.4,
        'fiesta': 0.3,
        'balikbayan_box': 0.25,
        'videoke_karaoke': 0.3,
        'adobo': 0.3,
        'filipino_celebrities': 0.4,
        'barong_filipiniana': 0.25,
        'palengke': 0.25,
        'bahay_kubo': 0.2,
        'sundo_hatid': 0.15,
        'tambay': 0.2,
        'resilience': 0.3,
        'street_culture': 0.25
    }
    
    for i in range(num_campaigns):
        # Create a unique campaign
        campaign_id = f"C{i+1:03d}"
        brand = np.random.choice(BRANDS)
        year = int(np.random.choice(range(2020, 2026)))  # Convert to regular int
        campaign_name = f"{brand} Campaign {np.random.choice(['Fiesta', 'Celebration', 'Family', 'Joy', 'Culture', 'Tradition', 'Heritage', 'Home', 'Community', 'Together'])} {year}"
        
        # Determine which Filipino elements are present
        elements = {}
        for element in FILIPINO_ELEMENTS:
            prob = element_probabilities.get(element, 0.2)
            elements[f"has_{element}"] = 1 if np.random.random() < prob else 0
        
        # Calculate Filipino index based on number of elements
        filipino_index = sum([elements[f"has_{e}"] for e in FILIPINO_ELEMENTS]) / len(FILIPINO_ELEMENTS)
        
        # Generate correlated business metrics
        # Campaigns with more Filipino elements tend to perform better
        base_roi = 1.5 + filipino_index * np.random.uniform(0.5, 2.0)
        base_sales_lift = 5.0 + filipino_index * np.random.uniform(3.0, 15.0)
        base_brand_lift = 3.0 + filipino_index * np.random.uniform(2.0, 10.0)
        
        # Add some noise to business metrics
        roi = max(0.1, round(float(base_roi + np.random.normal(0, 0.5)), 2))
        sales_lift = max(0.0, round(float(base_sales_lift + np.random.normal(0, 2.0)), 2))
        brand_lift = max(0.0, round(float(base_brand_lift + np.random.normal(0, 1.5)), 2))
        
        # Award count is influenced by Filipino index and business metrics
        award_prob = (filipino_index * 0.5) + (roi / 5.0) * 0.3 + (brand_lift / 10.0) * 0.2
        award_count = int(np.random.binomial(5, min(1.0, award_prob)))  # Convert to regular int
        
        # Create campaign entry
        campaign = {
            'campaign_id': campaign_id,
            'campaign_name': campaign_name,
            'brand': brand,
            'year': year,
            'filipino_index': round(float(filipino_index), 2),
            'roi': roi,
            'sales_lift': sales_lift,
            'brand_lift': brand_lift,
            'award_count': award_count
        }
        
        # Add Filipino elements
        campaign.update(elements)
        
        campaigns.append(campaign)
    
    return campaigns

class DemoVectorAnalysis:
    """Demo vector analysis for Filipino elements data"""
    
    def __init__(self, campaigns=None, model_name='paraphrase-multilingual-MiniLM-L12-v2'):
        """Initialize with sample data"""
        self.model_name = model_name
        
        # Check dependencies
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise ImportError("sentence-transformers is required. Install with: pip install sentence-transformers")
        
        # Load embedding model
        print(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        
        # Generate sample data if not provided
        self.campaign_data = campaigns if campaigns else generate_sample_data()
        self.campaign_ids = [c['campaign_id'] for c in self.campaign_data]
        
        # Initialize FAISS index
        self.index = None
    
    def create_campaign_descriptions(self):
        """Create textual descriptions of campaigns based on Filipino elements"""
        descriptions = []
        
        for campaign in self.campaign_data:
            filipino_elements = []
            
            # Get Filipino elements present in the campaign
            for element in FILIPINO_ELEMENTS:
                if campaign.get(f'has_{element}', 0) == 1:
                    filipino_elements.append(element.replace('_', ' '))
            
            # Create campaign description
            description = f"Campaign '{campaign['campaign_name']}' by {campaign['brand']} "
            
            if filipino_elements:
                description += f"featuring Filipino elements: {', '.join(filipino_elements)}. "
            else:
                description += "with no specific Filipino elements. "
            
            description += f"Filipino index: {campaign['filipino_index']}. "
            
            if 'roi' in campaign:
                description += f"ROI: {campaign['roi']}. "
            
            if 'award_count' in campaign:
                description += f"Awards: {campaign['award_count']}."
            
            descriptions.append(description)
        
        return descriptions
    
    def build_vector_index(self):
        """Build vector index from campaign descriptions"""
        # Create campaign descriptions
        descriptions = self.create_campaign_descriptions()
        
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
            json.dump(self.campaign_data, f, cls=NumpyEncoder, indent=2)
        
        # Save sample data for reference
        with open(os.path.join(OUTPUT_DIR, 'sample_filipino_campaigns.json'), 'w') as f:
            json.dump(self.campaign_data, f, cls=NumpyEncoder, indent=2)
        
        # Save latest paths
        with open(os.path.join(VECTOR_DB_PATH, "latest_paths.json"), 'w') as f:
            json.dump({
                "index_path": index_path,
                "campaign_ids_path": os.path.join(VECTOR_DB_PATH, f"campaign_ids_{timestamp}.pkl"),
                "campaign_data_path": os.path.join(VECTOR_DB_PATH, f"campaign_data_{timestamp}.json"),
                "timestamp": timestamp
            }, f, indent=2)
        
        print(f"Vector database saved to {VECTOR_DB_PATH}")
        print(f"Sample data saved to {os.path.join(OUTPUT_DIR, 'sample_filipino_campaigns.json')}")
    
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
                        'brand': campaign['brand'],
                        'year': campaign['year'],
                        'filipino_index': campaign['filipino_index'],
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
            avg_filipino_index = sum(c['filipino_index'] for c in cluster_campaigns) / len(cluster_campaigns)
            
            # Count Filipino elements
            element_counts = {}
            for campaign in cluster_campaigns:
                for element in FILIPINO_ELEMENTS:
                    if campaign.get(f'has_{element}', 0) == 1:
                        element_counts[element] = element_counts.get(element, 0) + 1
            
            # Sort elements by frequency
            top_elements = sorted(element_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            
            # Calculate average ROI if available
            roi_values = [c['roi'] for c in cluster_campaigns if 'roi' in c]
            avg_roi = sum(roi_values) / len(roi_values) if roi_values else None
            
            # Calculate average award count if available
            award_counts = [c['award_count'] for c in cluster_campaigns if 'award_count' in c]
            avg_award_count = sum(award_counts) / len(award_counts) if award_counts else None
            
            # Sample campaigns
            sample_campaigns = sorted(
                [(c['campaign_name'], c['brand'], c['year']) for c in cluster_campaigns],
                key=lambda x: x[2],
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
        
        # Key insights section
        markdown += f"## Key Insights\n\n"
        
        # Analyze which elements correlate with high ROI
        element_roi_correlation = {}
        for element in FILIPINO_ELEMENTS:
            element_campaigns = [c for c in self.campaign_data if c.get(f'has_{element}', 0) == 1 and 'roi' in c]
            non_element_campaigns = [c for c in self.campaign_data if c.get(f'has_{element}', 0) == 0 and 'roi' in c]
            
            if element_campaigns and non_element_campaigns:
                avg_roi_with = sum(c['roi'] for c in element_campaigns) / len(element_campaigns)
                avg_roi_without = sum(c['roi'] for c in non_element_campaigns) / len(non_element_campaigns)
                element_roi_correlation[element] = avg_roi_with - avg_roi_without
        
        # Top elements by ROI influence
        top_roi_elements = sorted(element_roi_correlation.items(), key=lambda x: x[1], reverse=True)[:3]
        
        markdown += f"### Top Elements for ROI\n\n"
        markdown += f"The following Filipino elements showed the strongest positive impact on ROI:\n\n"
        for element, roi_diff in top_roi_elements:
            markdown += f"- **{element.replace('_', ' ')}**: +{roi_diff:.2f} average ROI difference\n"
        markdown += f"\n"
        
        # Analyze which elements correlate with awards
        element_award_correlation = {}
        for element in FILIPINO_ELEMENTS:
            element_campaigns = [c for c in self.campaign_data if c.get(f'has_{element}', 0) == 1 and 'award_count' in c]
            non_element_campaigns = [c for c in self.campaign_data if c.get(f'has_{element}', 0) == 0 and 'award_count' in c]
            
            if element_campaigns and non_element_campaigns:
                avg_awards_with = sum(c['award_count'] for c in element_campaigns) / len(element_campaigns)
                avg_awards_without = sum(c['award_count'] for c in non_element_campaigns) / len(non_element_campaigns)
                element_award_correlation[element] = avg_awards_with - avg_awards_without
        
        # Top elements by award influence
        top_award_elements = sorted(element_award_correlation.items(), key=lambda x: x[1], reverse=True)[:3]
        
        markdown += f"### Top Elements for Awards\n\n"
        markdown += f"The following Filipino elements showed the strongest positive impact on award recognition:\n\n"
        for element, award_diff in top_award_elements:
            markdown += f"- **{element.replace('_', ' ')}**: +{award_diff:.2f} average awards difference\n"
        markdown += f"\n"
        
        # Element co-occurrence insights
        markdown += f"### Element Co-occurrence Patterns\n\n"
        markdown += f"Certain Filipino elements frequently appear together in successful campaigns:\n\n"
        
        # Identify common element combinations in high-performing campaigns
        high_roi_campaigns = sorted(self.campaign_data, key=lambda c: c.get('roi', 0), reverse=True)[:10]
        high_roi_elements = {}
        
        for campaign in high_roi_campaigns:
            for element in FILIPINO_ELEMENTS:
                if campaign.get(f'has_{element}', 0) == 1:
                    high_roi_elements[element] = high_roi_elements.get(element, 0) + 1
        
        common_combinations = [
            ('family_values', 'filipino_food'),
            ('filipino_celebrities', 'pinoy_humor'),
            ('sari_sari', 'street_culture'),
            ('fiesta', 'filipino_food'),
            ('resilience', 'family_values')
        ]
        
        for elem1, elem2 in common_combinations:
            campaigns_with_both = [c for c in self.campaign_data 
                                 if c.get(f'has_{elem1}', 0) == 1 and c.get(f'has_{elem2}', 0) == 1]
            
            if campaigns_with_both:
                avg_roi = sum(c.get('roi', 0) for c in campaigns_with_both) / len(campaigns_with_both)
                avg_awards = sum(c.get('award_count', 0) for c in campaigns_with_both) / len(campaigns_with_both)
                
                markdown += f"- **{elem1.replace('_', ' ')} + {elem2.replace('_', ' ')}**: "
                markdown += f"Average ROI: {avg_roi:.2f}, Average Awards: {avg_awards:.2f}\n"
        
        # Save report
        report_path = os.path.join(OUTPUT_DIR, 'filipino_elements_vector_analysis.md')
        with open(report_path, 'w') as f:
            f.write(markdown)
        
        print(f"Vector analysis report saved to {report_path}")
        return report_path

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Demo Vector Analysis for Filipino Elements")
    parser.add_argument('--build', action='store_true', help="Build vector index from sample data")
    parser.add_argument('--analyze', action='store_true', help="Generate vector analysis report")
    parser.add_argument('--clusters', type=int, default=5, help="Number of clusters (default: 5)")
    parser.add_argument('--search', type=str, help="Search for similar campaigns")
    parser.add_argument('--samples', type=int, default=40, help="Number of sample campaigns to generate")
    parser.add_argument('--model', type=str, default='paraphrase-multilingual-MiniLM-L12-v2', 
                       help="Sentence transformer model name")
    
    args = parser.parse_args()
    
    try:
        # Generate sample data
        print(f"Generating {args.samples} sample campaigns...")
        sample_data = generate_sample_data(args.samples)
        
        # Create demo analyzer
        analyzer = DemoVectorAnalysis(sample_data, model_name=args.model)
        
        if args.build or not (args.search or args.analyze):
            # Build vector index
            analyzer.build_vector_index()
        
        if args.search:
            # Search for similar campaigns
            results = analyzer.find_similar_campaigns(args.search)
            
            if results:
                print(f"\nCampaigns similar to: '{args.search}'")
                print("=" * 50)
                for i, result in enumerate(results):
                    print(f"{i+1}. {result['campaign_name']} ({result['brand']}, {result['year']})")
                    print(f"   Filipino Index: {result['filipino_index']:.2f}")
                    if result.get('roi') is not None:
                        print(f"   ROI: {result['roi']:.2f}")
                    if result.get('award_count') is not None:
                        print(f"   Awards: {result['award_count']}")
                    print(f"   Similarity Score: {result['similarity_score']:.4f}")
                    print()
            else:
                print("No similar campaigns found.")
        
        if args.analyze:
            # Set number of clusters
            analyzer.cluster_campaigns(n_clusters=args.clusters)
            
            # Generate report
            report_path = analyzer.generate_embedding_report()
            
            if report_path:
                print(f"Report generated: {report_path}")
                # Open the report on macOS
                if os.name == 'posix' and os.uname().sysname == 'Darwin':
                    os.system(f"open {report_path}")
    
    except Exception as e:
        import traceback
        print(f"Error in demo vector analysis: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main()