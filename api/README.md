# TBWA HRIS Backend

AI-Central HRIS Backend Services for TBWA - A comprehensive backend system that powers conversational AI workflows for HR operations.

## 🚀 Features

- **AI Chat Processing** - OpenAI-powered conversational interface
- **Workflow Detection & Execution** - Automatic intent detection and workflow routing
- **Document Search** - Vector-based semantic search with embeddings
- **Expense Management** - Complete expense reporting system
- **Real-time Metrics** - Prometheus monitoring and observability
- **Scalable Architecture** - Production-ready with Docker deployment

## 📋 Requirements

- Node.js ≥18.0.0
- Supabase account and project
- OpenAI API key
- Docker (for deployment)

## 🛠️ Installation

1. **Clone and setup**
   ```bash
   cd api
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Database setup**
   ```bash
   # Run migrations in your Supabase SQL Editor
   cat utils/migrations.sql
   # Copy and execute the SQL in Supabase dashboard
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

### Required
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for backend operations
- `OPENAI_API_KEY` - OpenAI API key for chat and embeddings

### Optional
- `PULSER_MCP_URL` - Pulser MCP endpoint for enhanced integrations
- `JWT_SECRET` - Custom JWT secret (auto-generated if not provided)
- `LOG_LEVEL` - Logging level (info, debug, warn, error)

## 📚 API Documentation

### Core Endpoints

#### Chat Service
```bash
POST /api/chat
GET /api/chat/history/:sessionId
GET /api/chat/sessions
DELETE /api/chat/sessions/:sessionId
```

#### Workflow Service
```bash
POST /api/workflow/detect
POST /api/workflow/execute
GET /api/workflow/
GET /api/workflow/executions
```

#### Document Search
```bash
POST /api/docs/search
GET /api/docs/:id
GET /api/docs/type/:type
GET /api/docs/suggest/:query
```

#### Expense Management
```bash
GET /api/expenses
POST /api/expenses
GET /api/expenses/:id
PUT /api/expenses/:id
DELETE /api/expenses/:id
GET /api/expenses/analytics
```

### Example Usage

#### Chat Request
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need to submit an expense for lunch yesterday",
    "sessionId": "session_123"
  }'
```

#### Workflow Detection
```bash
curl -X POST http://localhost:3001/api/workflow/detect \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I forgot to clock in this morning"
  }'
```

#### Document Search
```bash
curl -X POST http://localhost:3001/api/docs/search \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "expense policy reimbursement",
    "limit": 5
  }'
```

## 🏗️ Architecture

### Service Structure
```
api/
├── ai-services/           # Core AI functionality
│   ├── chat/             # Chat processing service
│   ├── workflow/         # Workflow detection & execution
│   │   └── workflows/    # Individual workflow handlers
│   └── documents/        # Document search & indexing
├── config/               # Configuration files
├── middleware/           # Express middleware
├── routes/              # API route handlers
├── utils/               # Utilities and helpers
└── server.js            # Main application entry
```

### Workflow Handlers
- **ExpenseWorkflow** - Expense report creation and management
- **TimeWorkflow** - Time tracking corrections
- **LeaveWorkflow** - Leave request processing
- **ITWorkflow** - IT support ticket creation

### Database Schema
- **chat_conversations** - AI chat history and context
- **documents** - Policy documents with vector embeddings
- **workflows** - Workflow definitions and patterns
- **workflow_executions** - Execution logs and results
- **expenses** - Expense reports and details
- **receipts** - Receipt attachments with OCR data
- **leave_requests** - Time off requests
- **time_corrections** - Time entry corrections
- **it_tickets** - IT support tickets

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t tbwa-hris-backend .
docker run -p 3001:3001 --env-file .env tbwa-hris-backend
```

### Render Deployment
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set environment variables in Render dashboard
4. Deploy automatically on push to main

### Environment-specific Configurations

#### Development
```bash
NODE_ENV=development
LOG_LEVEL=debug
METRICS_ENABLED=true
```

#### Production
```bash
NODE_ENV=production
LOG_LEVEL=info
RATE_LIMIT_MAX=1000
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/healthz
```

### Metrics (Prometheus format)
```bash
curl http://localhost:3001/metrics
```

### Key Metrics
- `tbwa_hris_chat_requests_total` - Total chat requests
- `tbwa_hris_workflow_executions_total` - Workflow executions
- `tbwa_hris_document_search_total` - Document searches
- `tbwa_hris_openai_requests_total` - OpenAI API calls
- `tbwa_hris_http_requests_total` - HTTP request metrics

## 🔒 Security

### Authentication
- JWT-based authentication
- Row Level Security (RLS) in Supabase
- Rate limiting per user and endpoint

### Data Protection
- Environment variable validation
- Input sanitization and validation
- Secure error handling (no sensitive data exposure)

### Best Practices
- All API keys in environment variables
- HTTPS enforcement in production
- CORS configuration for allowed origins
- Request timeout protection

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=chat
```

### Test Structure
- Unit tests for individual services
- Integration tests for API endpoints
- Mock external services (OpenAI, Supabase)

## 🐛 Debugging

### Enable Debug Logging
```bash
LOG_LEVEL=debug npm run dev
```

### Check Service Health
```bash
# Database connectivity
curl http://localhost:3001/healthz

# OpenAI service
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

### Common Issues

1. **OpenAI API Errors**
   - Check API key validity
   - Verify rate limits
   - Monitor token usage

2. **Database Connection**
   - Validate Supabase URLs and keys
   - Check RLS policies
   - Verify table schemas

3. **Authentication Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration
   - Validate user permissions

## 📈 Performance

### Optimization Features
- Response caching for document embeddings
- Connection pooling for database
- Request deduplication
- Efficient vector similarity search

### Scaling Considerations
- Horizontal scaling with Docker
- Database connection limits
- OpenAI API rate limiting
- Memory usage for embedding cache

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style
- Use ESLint configuration
- Follow existing patterns
- Add JSDoc comments for functions
- Include error handling

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs with `LOG_LEVEL=debug`
3. Create an issue in the repository
4. Contact the development team

---

**TBWA HRIS Backend** - Making HR workflows conversational with AI 🤖