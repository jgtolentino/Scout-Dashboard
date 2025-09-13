# Sari-Sari Store Transaction Metrics Enhancement

## Overview

This document provides a summary of the enhancements implemented to capture and analyze Sari-Sari store transaction metrics within the Scout DLT Pipeline. The implementation focuses on extending the database schema, adding analytical capabilities for transaction data, and improving multimodal correlation between speech and visual signals.

## Implemented Components

### 1. Schema Validation and Enhancement

We analyzed the existing database schema and validated the proposed enhancements against it. The current schema includes:

- **SalesInteractions**: Core table for customer interactions
- **SalesInteractionBrands**: Brand relationships
- **SalesInteractionTranscripts**: Speech transcriptions
- **TranscriptChunkAudit**: Transcript quality analysis
- **Products**, **Customers**, **EdgeDeviceRegistry**: Supporting tables

The validation confirmed that the proposed schema enhancements are compatible with the existing structure and can be implemented with minimal disruption.

**Location**: `/migrations/sari_sari_schema_enhancements.sql`

### 2. SQL Migration Script

Created a comprehensive SQL migration script that:

- Extends the `SalesInteractions` table with new fields:
  - TransactionDuration
  - ProductCount
  - BasketValue
  - TransactionCompleted
  - DwellTimeSeconds
  - CustomerExpressions

- Creates new tables:
  - `TransactionProducts`: Tracks product quantities and substitutions
  - `RequestPatterns`: Identifies customer request types and categories
  - `UnbrandedItems`: Captures non-branded product references

- Adds reference tables and views:
  - `RequestTypes` and `RequestCategories` for classification
  - `ItemCategories` for product organization
  - `TransactionAnalysisView` for simplified reporting

- Provides stored procedures:
  - `CalculateTransactionMetrics`: Updates metrics based on session data
  - `ExtractCustomerExpressions`: Identifies emotional patterns in transcripts

**Location**: `/migrations/sari_sari_schema_enhancements.sql`

### 3. Transcript Analysis Extension

Implemented enhanced NLP processing specifically tuned for Filipino/Tagalog language patterns commonly found in Sari-Sari store interactions:

- **Request Pattern Detection**: Identifies patterns like price inquiries, product availability checks, substitution requests, and credit/utang requests
- **Product Mention Extraction**: Detects branded and unbranded product references
- **Customer Expression Analysis**: Captures emotional states from linguistic cues

The system integrates with the database to save analysis results in the corresponding tables.

**Location**: `/client360_dashboard/data/transcript_analysis_extension.js`

### 4. Audio-Visual Correlation Engine

Created a comprehensive correlation engine that aligns speech transcripts with visual detection events:

- **Time-Based Alignment**: Uses sliding window approach to correlate events by timestamp
- **Product Verification**: Matches spoken product mentions with visually detected items
- **Transaction Metrics Extraction**: Calculates metrics like duration, basket value, and dwell time
- **Database Integration**: Saves correlation results to the enhanced schema

This component provides the core functionality needed to leverage multimodal data for richer transaction insights.

**Location**: `/client360_dashboard/data/audio_visual_correlation.js`

## Integration Points

The implemented components integrate with the Scout DLT Pipeline through the following touchpoints:

1. **Database Schema**: The migration script extends the existing schema without disrupting current functionality
2. **NLP Pipeline**: The transcript analysis extension plugs into the existing NLP processing chain
3. **Event Correlation**: The audio-visual correlation engine works with the event data produced by the Bronze and Silver layers
4. **Dashboard Queries**: New SQL queries have been designed to expose the enhanced data to the Client360 Dashboard

## Usage Example

To process a customer interaction with the enhanced components:

```javascript
const transcriptAnalysis = require('./data/transcript_analysis_extension');
const audioVisualCorrelation = require('./data/audio_visual_correlation');

// Analyze a new transcript
async function processNewInteraction(transcript, sessionId, interactionId) {
    // Step 1: Analyze transcript for requests and product mentions
    const analysisResults = await transcriptAnalysis.analyzeTranscript(
        transcript, 
        sessionId, 
        interactionId
    );
    
    console.log(`Detected ${analysisResults.requestPatterns.length} request patterns`);
    console.log(`Detected ${analysisResults.productMentions.length} product mentions`);
    
    // Step 2: Correlate with visual data
    const correlationResults = await audioVisualCorrelation.correlateAudioVisual(sessionId);
    
    if (correlationResults.success) {
        console.log('Transaction metrics:');
        console.log(`- Duration: ${correlationResults.transactionMetrics.transactionDuration} seconds`);
        console.log(`- Products: ${correlationResults.transactionMetrics.productCount}`);
        console.log(`- Basket value: ₱${correlationResults.transactionMetrics.basketValue.toFixed(2)}`);
        console.log(`- Completed: ${correlationResults.transactionMetrics.transactionCompleted ? 'Yes' : 'No'}`);
    }
}
```

## Database Query Examples

The following SQL queries demonstrate how to extract insights from the enhanced schema:

```sql
-- Get transaction metrics with substitution patterns
SELECT 
    si.InteractionID,
    si.SessionID,
    si.TransactionDuration,
    si.BasketValue,
    si.ProductCount,
    COUNT(tp.TransactionProductID) AS TotalProducts,
    SUM(CASE WHEN tp.IsSubstitution = 1 THEN 1 ELSE 0 END) AS Substitutions,
    JSON_QUERY(si.CustomerExpressions) AS Expressions
FROM 
    dbo.SalesInteractions si
LEFT JOIN 
    dbo.TransactionProducts tp ON si.InteractionID = tp.InteractionID
WHERE 
    si.StoreID = 112 AND
    si.InteractionTimestamp >= DATEADD(day, -7, GETDATE())
GROUP BY 
    si.InteractionID, si.SessionID, si.TransactionDuration,
    si.BasketValue, si.ProductCount, si.CustomerExpressions
ORDER BY 
    si.InteractionTimestamp DESC;

-- Get most common request patterns by category
SELECT 
    rc.CategoryName,
    rt.TypeName AS RequestType,
    COUNT(*) AS Occurrences,
    AVG(rp.RequestFrequency) AS AvgFrequency
FROM 
    dbo.RequestPatterns rp
JOIN 
    dbo.RequestTypes rt ON rp.RequestType = rt.TypeName
JOIN 
    dbo.RequestCategories rc ON rp.RequestCategory = rc.CategoryName
WHERE
    rp.CreatedAt >= DATEADD(day, -30, GETDATE())
GROUP BY 
    rc.CategoryName, rt.TypeName
ORDER BY 
    Occurrences DESC;

-- Get unbranded item trends
SELECT 
    ui.ItemDescription,
    ic.CategoryName,
    COUNT(*) AS Occurrences,
    SUM(ui.Quantity) AS TotalQuantity
FROM 
    dbo.UnbrandedItems ui
LEFT JOIN 
    dbo.ItemCategories ic ON ui.CategoryAssociation = ic.CategoryName
WHERE 
    ui.CreatedAt >= DATEADD(day, -30, GETDATE())
GROUP BY 
    ui.ItemDescription, ic.CategoryName
ORDER BY 
    Occurrences DESC;
```

## Next Steps

1. **DLT Pipeline Integration**: Update the DLT pipeline to leverage the enhanced schema
2. **Dashboard Updates**: Extend the Client360 Dashboard to display the new transaction metrics
3. **ML Model Training**: Train specialized models for Filipino language understanding
4. **Regional Customization**: Add support for dialect variations across Philippine regions

## Conclusion

The implemented enhancements significantly increase the Scout DLT Pipeline's ability to capture, analyze, and visualize Sari-Sari store transaction metrics. By extending the schema and adding specialized analysis components, we've enabled richer insights into customer behaviors, product interactions, and transaction patterns within the unique context of Filipino Sari-Sari stores.