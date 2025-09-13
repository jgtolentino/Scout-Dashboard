# Data Schema Analysis for Retail Advisor GenAI Integration

## Database Schema Structure

The Retail Advisor system implements a **Medallion Architecture** with four layers:

1. **Bronze Layer**: Raw data collection
   - `insight_pulse_ai.bronze.transcripts`
   - Raw transcripts from customer interactions

2. **Silver Layer**: Enriched data
   - `insight_pulse_ai.silver.transcripts` 
   - `insight_pulse_ai.silver.transcript_entity_mentions`
   - Added entity recognition and sentiment

3. **Gold Layer**: Analysis-ready data
   - `insight_pulse_ai.gold.transcript_insights`
   - Reconstructed transcripts with context

4. **Platinum Layer**: GenAI-enhanced data
   - `insight_pulse_ai.platinum.genai_insights` (primary insights table)
   - `insight_pulse_ai.platinum.insight_actions` (recommended actions)

## Insights Data Model

The core insights table (`genai_insights`) has the following structure:

```sql
CREATE TABLE insight_pulse_ai.platinum.genai_insights (
  insight_id STRING NOT NULL,
  insight_type STRING NOT NULL COMMENT 'Type of insight: general, brand, sentiment, trend',
  insight_title STRING NOT NULL COMMENT 'Concise title describing the insight',
  insight_text STRING NOT NULL COMMENT 'Detailed explanation of the insight with supporting evidence',
  confidence_score FLOAT COMMENT 'Model confidence in this insight (0.0-1.0)',
  source_transcripts ARRAY<STRING> COMMENT 'List of transcript IDs that contributed to this insight',
  brands_mentioned ARRAY<STRING> COMMENT 'Brands mentioned in this insight',
  time_period STRING COMMENT 'Date range this insight covers',
  generated_by STRING COMMENT 'Provider that generated the insight (claude, openai, deepseek)',
  model_name STRING COMMENT 'Specific model used for generation',
  prompt_tokens INT COMMENT 'Number of tokens in the prompt',
  completion_tokens INT COMMENT 'Number of completion tokens generated',
  processing_timestamp TIMESTAMP COMMENT 'When this insight was generated',
  summary_tags ARRAY<STRING> COMMENT 'Tags summarizing key themes in the insight',
  PRIMARY KEY (insight_id)
)
```

The recommended actions table (`insight_actions`) has the following structure:

```sql
CREATE TABLE insight_pulse_ai.platinum.insight_actions (
  action_id STRING NOT NULL,
  insight_id STRING NOT NULL,
  action_text STRING NOT NULL COMMENT 'Description of the recommended action',
  priority STRING COMMENT 'Priority level: high, medium, low',
  category STRING COMMENT 'Category of action: product, marketing, operations, etc.',
  status STRING COMMENT 'Current status: pending, in_progress, completed, rejected',
  assigned_to STRING COMMENT 'Person or team assigned to action',
  estimated_impact STRING COMMENT 'Estimated business impact: high, medium, low',
  due_date DATE COMMENT 'Target date for action completion',
  created_timestamp TIMESTAMP COMMENT 'When this action was created',
  updated_timestamp TIMESTAMP COMMENT 'When this action was last updated',
  PRIMARY KEY (action_id),
  CONSTRAINT fk_insight
    FOREIGN KEY (insight_id) 
    REFERENCES insight_pulse_ai.platinum.genai_insights(insight_id)
)
```

## Available View Definitions

Several pre-built views are available for common analysis patterns:

1. **View by Brand** (`vw_insights_by_brand`):
   - Explodes brand mentions for analysis by brand
   - Calculates average confidence score per brand
   - Aggregates insights by brand

2. **View by Type** (`vw_insights_by_type`):
   - Groups insights by type (general, brand, sentiment, trend)
   - Calculates average confidence scores
   - Shows last updated timestamp

3. **Trending Tags** (`vw_trending_tags`):
   - Identifies popular tags across insights
   - Filters to recent insights (last 30 days)
   - Provides tag frequency and confidence metrics

## Sample Data Availability

### 1. Sample Insights

Three sample insights are available in `/data/insights/reports/`:
- `sample_insight_001.json` - Customer sentiment trend
- `sample_insight_002.json` - Marketing/promotion analysis
- `sample_insight_003.json` - Product performance insight

Example insight format:
```json
{
  "id": "INS-001-2025-05-13-001",
  "timestamp": "2025-05-13T14:30:00Z",
  "model": "claude",
  "type": "customer",
  "status": "completed",
  "source": {
    "dataLake": "azure-adls",
    "table": "customer_feedback",
    "queryId": "CF-2025-Q2-001"
  },
  "insight": {
    "title": "Customer Sentiment Trend: Positive Shift After UI Update",
    "summary": "Analysis of customer feedback from the past 3 months shows a 23% increase in positive sentiment following the UI update in April 2025. Customers specifically mention improved navigation (42%), faster checkout process (38%), and better product images (31%).",
    "confidence": 0.87,
    "keywords": ["UI update", "customer sentiment", "navigation", "checkout", "product images"],
    "recommendations": [
      "Expand UI improvements to mobile app based on positive web feedback",
      "Create case study highlighting successful UI transformation",
      "Apply similar navigation patterns to other product areas"
    ]
  },
  "metadata": {
    "processingTime": 4.2,
    "tokenCount": 1842,
    "dataPoints": 1245,
    "version": "1.0.3"
  }
}
```

### 2. Metrics Data

Metrics data is available in `/data/insights/metrics.json` with:
- System performance metrics (CPU, memory, disk)
- Insight generation statistics by model and type
- Historical metrics for the past week

### 3. Test Data Generation

A script (`generate_test_data.py`) is available to generate:
- Mock transcript data with brand mentions
- Simulated sentiment and topics
- Configurable volume (default suggestion: 100 records)
- Optional direct upload to Azure Blob Storage

Sample brands included in the generator:
```python
BRANDS = [
    "Jollibee", "McDonald's", "KFC", "Burger King", "Wendy's", 
    "Pizza Hut", "Taco Bell", "Subway", "Starbucks", "Dunkin' Donuts"
]
```

## Data Transformation Flow

The overall data transformation follows this flow:

1. **Ingest**: Raw transcripts loaded to Bronze layer
2. **Enrich**: Entity recognition and sentiment analysis in Silver layer
3. **Contextualize**: Transcript reconstruction in Gold layer
4. **Generate Insights**: LLM processing in Platinum layer 
5. **Visualize**: Dashboard presentation of insights

## Conclusion

The data schema is well-structured with a complete Medallion Architecture pattern. Sample data is available for development and testing, with a test data generator for creating larger volumes of test data. The views provide convenient access patterns for different analysis needs.

The system does not use a traditional star schema, but rather a normalized structure with foreign key relationships between insights and actions, and denormalized views for specific query patterns.

For dashboard implementation, sufficient data is available through:
1. Sample insights for UI development
2. Test data generator for volume testing
3. Schema definitions for query building
4. View definitions for common data access patterns