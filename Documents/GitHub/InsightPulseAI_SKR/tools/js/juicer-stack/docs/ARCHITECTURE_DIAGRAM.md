# Juicer GenAI Insights: Architecture Diagram

```mermaid
graph TD
    classDef bronze fill:#cd7f32,color:white;
    classDef silver fill:#C0C0C0,color:black;
    classDef gold fill:#FFD700,color:black;
    classDef platinum fill:#E5E4E2,color:black;
    classDef azure fill:#0089D6,color:white;
    classDef genai fill:#9C27B0,color:white;
    classDef dashboard fill:#4CAF50,color:white;
    classDef monitoring fill:#FF5722,color:white;

    A[Azure SQL / Transcript Sources] -->|Ingestion| B[Bronze Layer]
    B -->|Brand Extraction| C[Silver Layer]
    C -->|Transcript Reconstruction| D[Gold Layer]
    D -->|GenAI Processing| E[Platinum Layer]
    E -->|Visualization| F[Insights Dashboard]
    
    G[Claude API] -->|Primary Model| D
    H[OpenAI API] -->|Fallback Model| D
    I[DeepSeek API] -->|Fallback Model| D
    
    J[Quality Monitoring] -.->|Validation| E
    K[Confidence Scoring] -.->|Filtering| E
    
    L[Databricks Jobs] -->|Automation| B
    L -->|Automation| C
    L -->|Automation| D
    L -->|Automation| E
    
    M[Azure Key Vault] -.->|Secure APIs| G
    M -.->|Secure APIs| H
    M -.->|Secure APIs| I
    
    N[Static Web App] -.->|Hosting| F
    
    class A azure;
    class B bronze;
    class C silver;
    class D gold;
    class E platinum;
    class F dashboard;
    class G genai;
    class H genai;
    class I genai;
    class J monitoring;
    class K monitoring;
    class L azure;
    class M azure;
    class N azure;
```

## Key Components

### Data Layers
- **Bronze Layer**: Raw transcript data
- **Silver Layer**: Brand mentions with sentiment
- **Gold Layer**: Reconstructed transcripts
- **Platinum Layer**: GenAI insights

### Azure Resources
- **Databricks Workspace**: Data processing
- **Storage Account**: Data lake storage
- **Key Vault**: Secure credentials
- **Static Web App**: Dashboard hosting

### GenAI Processing
- **Multi-model approach**: Claude, OpenAI, DeepSeek
- **Automatic fallback**: For model resilience
- **Confidence scoring**: Quality validation

### Integration
- **Pulser CLI**: Command-line access
- **GitHub Actions**: CI/CD automation
- **Scheduled Jobs**: Regular processing