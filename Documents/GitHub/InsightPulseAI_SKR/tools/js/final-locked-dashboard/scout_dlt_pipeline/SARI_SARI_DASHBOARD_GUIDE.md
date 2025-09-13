# Scout Analytics Dashboard for Sari-Sari Stores

This guide provides details on using the Scout Analytics System to develop and demonstrate dashboards for Sari-Sari stores in the Philippines.

## Overview

The Scout Analytics System for Sari-Sari stores processes data from Raspberry Pi devices deployed across various stores, capturing customer interactions through audio and visual signals. The system transforms this data into actionable insights displayed on customizable dashboards.

## Data Sources

The system uses these key data sources:

1. **Speech-to-Text Data**
   - Customer transcripts in Filipino/Tagalog
   - Brand and product mentions
   - Audio recordings (if using rollback_test_data.json)

2. **Visual Detection Data**
   - Face detection (anonymized)
   - Product detection
   - Zone activity and dwell time

3. **Device Heartbeat Data**
   - Raspberry Pi device status
   - Battery levels and health metrics
   - Network connectivity information

4. **Product Catalog**
   - Reference data for products sold in Sari-Sari stores
   - Categories, brands, pricing

## Using the Test Script

The included `test_sari_sari_analytics.sh` script demonstrates the complete ETL pipeline, data processing, and dashboard visualization for Sari-Sari store analytics:

```bash
# Make the script executable
chmod +x test_sari_sari_analytics.sh

# Run with default settings
./test_sari_sari_analytics.sh

# Run with custom Event Hub connection string
EVENTHUB_CONNECTION="Endpoint=sb://scout-eh..." ./test_sari_sari_analytics.sh

# Adjust speed of the demo (seconds between steps)
ETL_SPEED=2 ./test_sari_sari_analytics.sh
```

## Dashboard Features

The Scout Analytics Dashboard includes the following key features:

### 1. Store Overview

- Daily sales trends and patterns
- Customer traffic by day and time
- Top-selling products
- Conversion rates for browsing, checkout, and return visits

### 2. Brand Analytics

- Brand mention frequency and trends
- Brand conversion rates
- Product association map
- Upsell and cross-sell opportunities

### 3. Customer Insights

- Interaction patterns and preferences
- Sentiment analysis on Filipino/Tagalog speech
- Product preferences by demographic
- Visit frequency and loyalty metrics

### 4. Operational Metrics

- Device health status monitoring
- Audio quality assessment
- System performance and reliability
- Error rate tracking

### 5. Filipino Consumer Behavior

- Regional language patterns
- Local product preferences
- Time-of-day purchasing behaviors
- Cultural insights and trends

## Developing Custom Dashboards

To develop custom dashboards using this data:

1. **Use the Test Data**
   ```bash
   # Export data to a specific directory
   ./test_sari_sari_analytics.sh > /path/to/dashboard/data/
   ```

2. **Sample Visualization Code**
   The repository includes examples for:
   - Python/Dash dashboards
   - Power BI templates
   - Grafana dashboards
   - D3.js visualizations

3. **Integrating Audio URLs**
   If using the rollback version with AudioURL functionality:
   ```javascript
   // Sample JavaScript for audio playback
   function playAudio(audioUrl) {
     const audioPlayer = document.getElementById('audio-player');
     audioPlayer.src = audioUrl;
     audioPlayer.play();
   }
   ```

## Demonstration Best Practices

When demonstrating the system to stakeholders:

1. **Focus on Filipino Context**
   - Highlight Tagalog/Filipino language processing
   - Showcase Sari-Sari store specific insights
   - Emphasize local product and brand recognition

2. **Key Metrics to Highlight**
   - Brand mention rates in natural conversation
   - Conversion rates from interest to purchase
   - Regional differences in consumer behavior
   - Device reliability in typical Sari-Sari settings

3. **Audio Playback**
   If using the rollback branch with AudioURL functionality:
   - Demonstrate the linkage between transcripts and audio
   - Show how store owners can verify transcriptions
   - Highlight quality assessment features

## Advanced Analytics

The Scout system supports advanced analytics including:

1. **NLP for Filipino Languages**
   - Brand detection in Tagalog/Filipino speech
   - Sentiment analysis tuned for local expressions
   - Regional dialect identification

2. **Computer Vision for Sari-Sari Stores**
   - Product recognition for local brands
   - Store layout optimization based on dwell time
   - Queue detection and management

3. **Time-Series Analytics**
   - Seasonal trends in product popularity
   - Daily and weekly patterns
   - Event correlation (e.g., weather, local events)

## Customizing for Different Regions

The dashboard can be customized for different regions in the Philippines:

```yaml
# Sample regional configuration
region_config:
  - name: "National Capital Region"
    languages: ["Tagalog", "English"]
    key_products: ["Milo", "Bear Brand", "Lucky Me"]
    
  - name: "Visayas"
    languages: ["Cebuano", "Hiligaynon", "English"]
    key_products: ["Milo", "Surf", "Great Taste"]
    
  - name: "Mindanao"
    languages: ["Cebuano", "Meranao", "Tagalog"]
    key_products: ["Kopiko", "Milo", "Surf"]
```

## Usage with ETL Pipeline

The demonstration script integrates with the complete ETL pipeline:

1. **Event Hub Integration**
   - Events from Pi devices to Event Hubs
   - Bronze layer ingestion
   - Silver layer transformation
   - Gold layer analytics

2. **Databricks Integration**
   - DLT pipelines for real-time processing
   - ML models for insights generation
   - Export mechanisms for dashboards

## Conclusion

The Scout Analytics System for Sari-Sari stores provides a powerful tool for understanding customer behavior, optimizing inventory, and improving store operations. With its focus on Filipino language processing and local context, it offers unique insights into this important retail segment.

For more information, contact the development team or refer to the additional documentation in the repository.