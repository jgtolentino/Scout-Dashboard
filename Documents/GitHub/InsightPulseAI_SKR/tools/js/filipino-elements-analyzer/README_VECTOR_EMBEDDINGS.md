# Vector Embedding Integration for Filipino Elements Analysis

This document explains how to use the vector embedding capabilities added to the Filipino Elements Analysis tool.

## Overview

The vector embedding functionality allows you to:

1. Convert Filipino cultural elements to vector embeddings
2. Perform semantic similarity search between campaigns
3. Cluster campaigns based on their Filipino cultural elements
4. Visualize relationships between campaigns and elements

## Requirements

The following Python packages are required:
- sentence-transformers
- faiss-cpu (or faiss-gpu if GPU is available)
- numpy
- matplotlib
- scikit-learn

You can install these dependencies with:

```bash
pip install numpy matplotlib scikit-learn sentence-transformers faiss-cpu
```

## Using Vector Embeddings

### 1. Building the Vector Index

Before using vector embeddings, you need to build a vector index from your SQLite database:

```bash
python vector_embedding_addon.py --build
```

This command:
- Extracts campaign data with Filipino elements from the database
- Creates textual descriptions of each campaign based on its elements
- Converts these descriptions to vector embeddings using sentence-transformers
- Builds a FAISS index for fast similarity search
- Saves the index and metadata to disk

### 2. Searching for Similar Campaigns

You can search for campaigns similar to a text query:

```bash
python vector_embedding_addon.py --search "Campaign with strong Filipino family values"
```

This will return campaigns that semantically match the query, even if they don't contain the exact words.

### 3. Clustering and Analysis

Generate a clustering analysis of your campaigns:

```bash
python vector_embedding_addon.py --analyze --clusters 5
```

This command:
- Clusters campaigns into groups based on Filipino element similarity
- Generates a t-SNE visualization of the campaign clusters
- Creates an analysis report with characteristics of each cluster
- Identifies the dominant Filipino elements in each cluster

The report is saved as `filipino_elements_vector_analysis.md` and includes:
- Cluster visualizations
- Average Filipino Index per cluster
- Top elements in each cluster
- Business impact metrics per cluster

## Integration with Filipino Elements Analyzer

The vector embedding functionality integrates with the existing Filipino Elements Analyzer:

1. **Similar Campaign Recommendations**: When analyzing a campaign, get recommendations for similar campaigns that have higher ROI or award counts.

2. **Element Importance**: Learn which Filipino elements contribute most to business success by analyzing their vector representations.

3. **Campaign Clustering**: Identify natural groupings in your campaign data beyond simple element presence/absence.

## Advanced Usage

### Custom Embedding Models

You can use a different embedding model by specifying it with the `--model` parameter:

```bash
python vector_embedding_addon.py --build --model "distiluse-base-multilingual-cased-v1"
```

Available models include:
- paraphrase-multilingual-MiniLM-L12-v2 (default, good balance of speed and quality)
- distiluse-base-multilingual-cased-v1 (smaller, faster)
- paraphrase-multilingual-mpnet-base-v2 (larger, more accurate)

### Adding New Campaigns

When you add new campaigns to the database, rebuild the vector index to include them:

```bash
python vector_embedding_addon.py --build
```

## Implementation Details

The implementation uses:

1. **Sentence Transformers** for converting campaign descriptions to vectors
2. **FAISS** for efficient similarity search and vector operations
3. **t-SNE** for dimensionality reduction and visualization
4. **K-means** for clustering similar campaigns

The embedding process includes:
1. Creating a textual description of each campaign's Filipino elements
2. Converting these descriptions to 384-dimensional vectors
3. Normalizing the vectors for cosine similarity comparison
4. Building an optimized index for fast retrieval

## Examples

### Finding Campaigns with Similar Filipino Elements

```bash
python vector_embedding_addon.py --search "Campaigns featuring Filipino street culture and humor"
```

### Analyzing Filipino Element Clusters

```bash
python vector_embedding_addon.py --analyze --clusters 7
```

### Complete Workflow

```bash
# Build the vector index
python vector_embedding_addon.py --build

# Generate a clustering analysis
python vector_embedding_addon.py --analyze

# Search for similar campaigns
python vector_embedding_addon.py --search "Campaigns with traditional Filipino values"
```