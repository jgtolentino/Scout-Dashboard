# Sari-Sari Store Transaction Metrics: DBO Schema Validation

## Current Schema Analysis

After examining the codebase, I've identified the following key tables in the `dbo` schema that are relevant to Sari-Sari store transaction metrics:

### 1. SalesInteractions
Core table for tracking customer interactions in stores:
- InteractionID (PK): Unique identifier for each interaction
- FacialID: Reference to anonymized facial recognition data
- DeviceID: ID of the capturing device
- StoreID: Store where interaction occurred
- ProductID: Product involved in interaction
- InteractionTimestamp: When interaction occurred
- InteractionType: Type of interaction (browsing, purchase, etc.)
- IngestedAt: Data ingestion timestamp
- SessionID: Correlates related interactions
- SessionStart: Beginning of the customer session
- SessionEnd: End of the customer session

### 2. SalesInteractionBrands
Correlates interactions with specific brands:
- InteractionBrandID (PK): Unique identifier
- InteractionID (FK): Reference to SalesInteractions
- BrandID: Brand involved in interaction
- MentionConfidence: Confidence score of brand detection
- CreatedAtUtc: Timestamp when record was created

### 3. SalesInteractionTranscripts
Stores text from audio recordings:
- TranscriptID (PK): Unique identifier
- InteractionID (FK): Reference to SalesInteractions
- TranscriptText: Full text of conversation
- TranscriptConfidence: Confidence score of transcription
- WordCount: Number of words in transcript
- LangCode: Language code (default 'en')

### 4. TranscriptChunkAudit
Tracks quality of transcript segments:
- ChunkID (PK): Unique identifier
- TranscriptID (FK): Reference to SalesInteractionTranscripts
- ChunkText: Segment of transcript
- StartOffset/EndOffset: Position within transcript
- TranscriptQualityScore: Quality assessment
- NoiseLevel: Background noise measurement
- IsReviewed: Manual review status

### 5. Customers
Store customer information:
- CustomerID (PK): Unique identifier
- Various demographic fields
- IsActive: Soft delete flag
- PersonaSegment: Customer segment for AI analysis

### 6. Products
Product catalog:
- ProductID (PK): Unique identifier
- Various product fields
- IsActive: Soft delete flag

### 7. EdgeDeviceRegistry
Device metadata:
- DeviceID (PK): Unique identifier
- DeviceType: Type of device
- Location: Physical location
- StoreID: Associated store
- ZoneID: Zone within store
- Other device metadata

### 8. Bronze-level tables
Raw data ingestion:
- bronze_transcriptions: Raw audio transcription data
- bronze_vision_detections: Raw computer vision data
- bronze_device_logs: Device telemetry and logs

## Validation of Proposed Schema Enhancements

### 1. SalesInteractions Table Enhancements

**Proposed Enhancement:**
```sql
ALTER TABLE dbo.SalesInteractions 
ADD TransactionDuration INT, 
    ProductCount INT, 
    BasketValue DECIMAL(10,2),
    TransactionCompleted BIT,
    DwellTimeSeconds INT,
    CustomerExpressions NVARCHAR(MAX);
```

**Validation:**
- **Compatible:** The current structure of SalesInteractions can accommodate these additional columns
- **Implementation Impact:** Low - simple ALTER TABLE statement
- **Dependencies:** None of the existing queries in `sql_queries.js` directly conflict with these additions

### 2. New TransactionProducts Table

**Proposed Enhancement:**
```sql
CREATE TABLE dbo.TransactionProducts (
    TransactionProductID INT IDENTITY(1,1) PRIMARY KEY,
    InteractionID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    IsSubstitution BIT NOT NULL DEFAULT 0,
    OriginalProductID INT NULL,
    SubstitutionReason NVARCHAR(255) NULL,
    CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_TransactionProducts_SalesInteractions 
        FOREIGN KEY (InteractionID) REFERENCES dbo.SalesInteractions(InteractionID),
    CONSTRAINT FK_TransactionProducts_Products 
        FOREIGN KEY (ProductID) REFERENCES dbo.Products(ProductID),
    CONSTRAINT FK_TransactionProducts_OriginalProducts 
        FOREIGN KEY (OriginalProductID) REFERENCES dbo.Products(ProductID)
);
```

**Validation:**
- **Compatible:** This new table extends the existing model without disruption
- **Implementation Impact:** Medium - requires new table with appropriate foreign keys
- **Dependencies:** 
  - Requires existing `SalesInteractions` and `Products` tables
  - Need to update the DLT pipeline in `scout_silver_dlt.py` to capture product quantity and substitution info

### 3. New RequestPatterns Table

**Proposed Enhancement:**
```sql
CREATE TABLE dbo.RequestPatterns (
    RequestPatternID INT IDENTITY(1,1) PRIMARY KEY,
    InteractionID INT NOT NULL,
    RequestType NVARCHAR(50) NOT NULL,
    RequestCategory NVARCHAR(50) NOT NULL,
    RequestFrequency INT NOT NULL DEFAULT 1,
    RegionalAssociation NVARCHAR(50) NULL,
    TimeOfDay TIME NULL,
    DayOfWeek TINYINT NULL,
    CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_RequestPatterns_SalesInteractions 
        FOREIGN KEY (InteractionID) REFERENCES dbo.SalesInteractions(InteractionID)
);
```

**Validation:**
- **Compatible:** This new table can be incorporated with existing transcript analysis
- **Implementation Impact:** Medium - requires new table and NLP processing
- **Dependencies:**
  - Requires updates to the transcript analysis component in `scout_gold_dlt.py`
  - Need to define request types and categories

### 4. New UnbrandedItems Table

**Proposed Enhancement:**
```sql
CREATE TABLE dbo.UnbrandedItems (
    UnbrandedItemID INT IDENTITY(1,1) PRIMARY KEY,
    InteractionID INT NOT NULL,
    ItemDescription NVARCHAR(255) NOT NULL,
    CategoryAssociation NVARCHAR(50) NULL,
    Quantity INT NOT NULL DEFAULT 1,
    RecognitionConfidence FLOAT NULL,
    CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_UnbrandedItems_SalesInteractions 
        FOREIGN KEY (InteractionID) REFERENCES dbo.SalesInteractions(InteractionID)
);
```

**Validation:**
- **Compatible:** Adds support for non-branded items without disrupting existing flows
- **Implementation Impact:** Medium - requires new table and product classification logic
- **Dependencies:**
  - Need to update product detection in the DLT pipeline
  - May require additional ML model for unbranded item classification

## Implementation Recommendations

### 1. Phased Approach
Recommend implementing the schema changes in the following order:
1. First Phase: SalesInteractions table enhancements (simple ALTER TABLE)
2. Second Phase: TransactionProducts table (extends product relationship model)
3. Third Phase: RequestPatterns table (requires NLP enhancements)
4. Fourth Phase: UnbrandedItems table (requires visual detection enhancements)

### 2. Data Pipeline Modifications

The following DLT pipeline components will need to be updated:

- **scout_bronze_dlt.py**:
  - Update schema definitions to include quantities and substitution fields
  - Enhance product detection to identify unbranded items

- **scout_silver_dlt.py**:
  - Add session duration calculation
  - Add product count aggregation
  - Implement transaction completion detection

- **scout_gold_dlt.py**:
  - Add request pattern categorization
  - Enhance regional association analysis
  - Implement basket value calculation

### 3. Dashboard Integration

**sql_queries.js** will need the following new queries:

```javascript
// Transaction Products Query
const getTransactionProducts = `
    SELECT
        t.InteractionID,
        p.ProductName,
        tp.Quantity,
        tp.IsSubstitution,
        CASE WHEN tp.IsSubstitution = 1 
            THEN (SELECT ProductName FROM dbo.Products WHERE ProductID = tp.OriginalProductID) 
            ELSE NULL 
        END AS OriginalProduct,
        tp.SubstitutionReason
    FROM dbo.TransactionProducts tp
    JOIN dbo.Products p ON tp.ProductID = p.ProductID
    JOIN dbo.SalesInteractions t ON tp.InteractionID = t.InteractionID
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    ORDER BY t.InteractionTimestamp DESC;
`;

// Request Patterns Query
const getRequestPatterns = `
    SELECT
        RequestCategory,
        COUNT(*) AS PatternCount,
        AVG(RequestFrequency) AS AvgFrequency,
        STRING_AGG(DISTINCT RegionalAssociation, ', ') AS Regions
    FROM dbo.RequestPatterns
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', brand: '$4', channel: '$5'})}
    GROUP BY RequestCategory
    ORDER BY PatternCount DESC;
`;

// Unbranded Items Query
const getUnbrandedItems = `
    SELECT
        ItemDescription,
        CategoryAssociation,
        SUM(Quantity) AS TotalQuantity,
        COUNT(DISTINCT InteractionID) AS Occurrences
    FROM dbo.UnbrandedItems
    ${buildWhereClause({lookback: '$1', region: '$2', category: '$3', channel: '$4'})}
    GROUP BY ItemDescription, CategoryAssociation
    ORDER BY TotalQuantity DESC;
`;
```

## Conclusion

The proposed schema enhancements are well-aligned with the existing database structure and can be implemented with minimal disruption to the current system. The changes will significantly improve the dashboard's ability to capture and analyze Sari-Sari store transaction metrics, particularly around product substitutions, unbranded items, and customer request patterns.

The implementation should be staged to allow testing at each phase, with careful attention to data quality and pipeline performance. The extensions leverage existing patterns in the codebase and maintain compatibility with the medallion architecture approach used throughout the Scout DLT pipeline.