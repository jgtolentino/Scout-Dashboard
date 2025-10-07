# TBWA Creative Campaign Analysis System

A comprehensive ColPali-style PageIndex system with Perplexity-style semantic indexing for creative campaign analysis. This monorepo contains a complete solution for processing, indexing, and searching creative files using Azure AI services.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ with pip
- Azure SQL Database access
- Azure OpenAI API access

### Environment Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Azure credentials in `.env.local`:
   ```bash
   # Required Azure SQL credentials
   AZURE_SQL_PASSWORD=your_password_here
   
   # Required Azure OpenAI credentials
   AZURE_OPENAI_API_KEY=your_key_here
   AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
   ```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Python dependencies:
   ```bash
   cd packages/pageindex-agent
   pip install -r requirements.txt
   ```

3. Build packages:
   ```bash
   npm run build
   ```

### Database Setup

1. Run database migration:
   ```bash
   npm run db:migrate
   ```

2. Check database status:
   ```bash
   npm run db:status
   ```

### Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
creative-campaign-analysis-system/
├── apps/
│   └── web-dashboard/          # Next.js dashboard application
├── packages/
│   ├── database/               # Database connection and migrations
│   ├── pageindex-agent/        # Python processing agent
│   └── shared/                 # Shared types and utilities
├── .env.example               # Environment configuration template
├── package.json               # Root package configuration
└── turbo.json                 # Turborepo configuration
```

## 🧩 Architecture Overview

### PageIndex System

The system implements a ColPali-style semantic indexing approach:

1. **File Processing**: Extracts content from PDFs, presentations, images, and videos
2. **Chunking**: Breaks content into semantic chunks with metadata
3. **AI Analysis**: Uses Azure OpenAI for embeddings, mood classification, and quality scoring
4. **Database Storage**: Stores indexed content in Azure SQL with full-text search
5. **Search Interface**: Provides semantic search with advanced filtering

### Key Components

#### 1. PageIndex Agent (`packages/pageindex-agent/`)
- Python agent for file processing
- Azure OpenAI integration for embeddings and classification
- Support for multiple file formats (PDF, PPTX, images, videos)
- Quality assessment and mood classification

#### 2. Database Layer (`packages/database/`)
- Azure SQL Database schema with 6 core tables
- Migration system for schema updates
- Health monitoring and status reporting
- Connection pooling and error handling

#### 3. Web Dashboard (`apps/web-dashboard/`)
- Next.js 15 with React 19
- Semantic search interface
- Campaign analytics and insights
- Real-time processing status

#### 4. Shared Package (`packages/shared/`)
- TypeScript types and schemas
- Zod validation
- Utility functions
- Common configurations

## 🛠️ Usage

### Processing Files

#### Single File
```bash
# Process a single file
npm run pageindex:process /path/to/file.pdf --campaign "Brand Campaign" --client "Client Name"
```

#### Batch Processing
```bash
# Process all files in a directory
npm run pageindex:process /path/to/campaign/ --batch --campaign "Brand Campaign"
```

### Searching Content

#### Via CLI
```bash
# Search for content
npm run pageindex:search "brand awareness campaign"
```

#### Via Web Interface
1. Open the dashboard at [http://localhost:3000](http://localhost:3000)
2. Use the semantic search interface
3. Apply filters by client, campaign, file type, mood, or quality score

### Database Management

#### Migration Commands
```bash
# Run pending migrations
npm run db:migrate

# Check database status
npm run db:status

# Reset database (caution!)
npm run db:reset
```

#### Health Checks
```bash
# Check system health
curl http://localhost:3000/health

# Get detailed status
curl http://localhost:3000/status
```

## 🗄️ Database Schema

### Core Tables

#### `pageIndex`
- Semantic chunks with embeddings
- Content type classification
- Quality and mood scoring
- Full-text search enabled

#### `fileMetadata`
- File information and processing status
- Campaign and client associations
- Azure blob and Google Drive links

#### `campaignInsights`
- Aggregated campaign analytics
- Effectiveness predictions
- Award submission tracking

#### `semanticIndex`
- Search optimization
- Topic clustering
- Similarity hashing

#### `qualityMetrics`
- Detailed quality assessments
- Multi-dimensional scoring
- Model versioning

#### `processingLogs`
- Audit trail for all operations
- Performance monitoring
- Error tracking

## 🔍 Search Features

### Semantic Search
- Natural language queries
- Embedding-based similarity
- Context-aware results

### Advanced Filtering
- Campaign name and client
- File type and content type
- Mood classification
- Quality score thresholds
- Date ranges

### Search Operators
- Phrase matching with quotes
- Boolean operators (AND, OR, NOT)
- Wildcard searches
- Field-specific searches

## 📊 Analytics

### Campaign Insights
- Content effectiveness prediction
- Mood distribution analysis
- Quality score trends
- Topic clustering

### Performance Metrics
- Processing time tracking
- Search response times
- Error rates and patterns
- Resource utilization

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Vercel Deployment
```bash
npm run deploy:prod
```

### Docker (Optional)
```bash
docker build -t tbwa-ces .
docker run -p 3000:3000 tbwa-ces
```

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Audit System
```bash
# Run comprehensive audit
npm run audit

# Check specific components
npm run audit:database
npm run audit:pageindex
npm run audit:search
```

## 📝 API Reference

### Search Endpoints

#### `POST /api/search`
Search for content with semantic similarity.

```json
{
  "query": "brand awareness campaign",
  "filters": {
    "campaign_name": "Summer 2024",
    "client_name": "Nike",
    "file_type": "presentation",
    "min_quality_score": 0.7
  },
  "limit": 20,
  "offset": 0
}
```

#### `GET /api/campaigns`
List all campaigns with insights.

#### `GET /api/files/:fileId`
Get file details and chunks.

### Processing Endpoints

#### `POST /api/process`
Upload and process new files.

#### `GET /api/status/:fileId`
Check processing status.

### Analytics Endpoints

#### `GET /api/analytics/overview`
System overview statistics.

#### `GET /api/analytics/campaigns/:campaignId`
Campaign-specific analytics.

## 🔧 Configuration

### Environment Variables

#### Required
- `AZURE_SQL_PASSWORD` - Database password
- `AZURE_OPENAI_API_KEY` - OpenAI API key
- `AZURE_OPENAI_ENDPOINT` - OpenAI endpoint URL

#### Optional
- `AZURE_STORAGE_CONNECTION_STRING` - Blob storage
- `AZURE_TENANT_ID` - Managed identity
- `MAX_FILE_SIZE_MB` - File size limit (default: 100)
- `PROCESSING_TIMEOUT_MS` - Processing timeout (default: 300000)

### Performance Tuning

#### Processing
- `CHUNK_SIZE` - Text chunk size (default: 1000)
- `OVERLAP_SIZE` - Chunk overlap (default: 100)
- `PARALLEL_PROCESSING_LIMIT` - Parallel file limit (default: 3)

#### Database
- `POOL_MAX` - Connection pool size (default: 10)
- `CONNECTION_TIMEOUT` - Connection timeout (default: 30000)
- `REQUEST_TIMEOUT` - Query timeout (default: 30000)

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed
1. Check credentials in `.env.local`
2. Verify Azure SQL firewall rules
3. Test connection: `npm run db:status`

#### Python Dependencies Missing
1. Install requirements: `pip install -r packages/pageindex-agent/requirements.txt`
2. Check Python version: `python --version` (3.8+ required)

#### Processing Timeouts
1. Increase `PROCESSING_TIMEOUT_MS`
2. Reduce file size or batch size
3. Check Azure OpenAI rate limits

#### Search Returns No Results
1. Verify files are processed: `npm run db:status`
2. Check search query syntax
3. Try broader search terms

### Debug Mode
```bash
# Enable debug logging
DEBUG=true npm run dev

# Verbose Python agent
VERBOSE_LOGGING=true npm run pageindex:process
```

### Health Checks
```bash
# System health
curl http://localhost:3000/health

# Database connectivity
npm run db:status

# Processing agent status
npm run pageindex:status
```

## 📈 Monitoring

### Metrics
- Processing throughput (files/hour)
- Search response times
- Database query performance
- Error rates by component

### Logging
- Structured JSON logs
- Error tracking with stack traces
- Performance timing
- User activity tracking

### Alerts
- Database connection failures
- Processing queue backlog
- High error rates
- Resource exhaustion

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Run tests: `npm run test`
3. Run audit: `npm run audit`
4. Submit pull request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Conventional commits

### Testing Requirements
- Unit test coverage > 80%
- Integration tests for APIs
- E2E tests for critical paths

## 📄 License

Copyright © 2024 TBWA Philippines. All rights reserved.

## 🆘 Support

For technical support:
1. Check troubleshooting guide above
2. Review error logs
3. Contact TBWA IT team
4. Submit GitHub issue

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** TBWA Philippines
