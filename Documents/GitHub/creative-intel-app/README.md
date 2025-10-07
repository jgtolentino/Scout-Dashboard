# Creative Intelligence App

A modern application for analyzing and extracting insights from creative assets using AI-powered feature extraction and RAG (Retrieval-Augmented Generation).

## Features

- 📁 **Google Drive Integration**: Seamlessly import creative assets from Google Drive
- 🔍 **Feature Extraction**: OCR, layout analysis, and visual feature detection
- 🤖 **AI-Powered Analysis**: Extract insights using GPT-4 and embeddings
- 📊 **Interactive UI**: Modern web interface for exploring creative assets
- 🔄 **Real-time Processing**: Stream processing for large creative assets

## Tech Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Backend**: FastAPI, Python 3.9+
- **Database**: PostgreSQL with pgvector
- **Vector Store**: Pinecone (or pgvector)
- **Storage**: Local filesystem (or S3)
- **AI/ML**: OpenAI GPT-4, Tesseract OCR

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/creative-intel-app.git
   cd creative-intel-app
   ```

2. Set up environment variables:
   ```bash
   cp .env.template .env
   # Edit .env with your configuration
   ```

3. Install dependencies:
   ```bash
   # Backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt

   # Frontend
   cd app
   npm install
   ```

4. Set up the database:
   ```bash
   psql -U your_user -d your_database -f config/pageindex.schema.sql
   ```

5. Start the development servers:
   ```bash
   # Backend
   uvicorn server.main:app --reload

   # Frontend
   cd app
   npm run dev
   ```

## Project Structure

```
creative-intel-app/
├── app/                       # Frontend (Next.js)
├── server/                    # Backend Logic
├── data/                      # Sample data and metadata
├── embeddings/                # Vector store integration
├── scripts/                   # Utility scripts
└── config/                    # Configuration files
```

## Development

- **Code Style**: Follow PEP 8 for Python, ESLint for TypeScript
- **Testing**: pytest for backend, Jest for frontend
- **Documentation**: Docstrings for Python, JSDoc for TypeScript

## Deployment

The app can be deployed to:
- Frontend: Vercel
- Backend: AWS Lambda or Azure Functions
- Database: Managed PostgreSQL service
- Vector Store: Pinecone or pgvector

## License

MIT License - see LICENSE file for details 