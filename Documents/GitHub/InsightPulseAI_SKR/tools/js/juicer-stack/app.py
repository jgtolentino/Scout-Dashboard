"""
Juicer Chat with Data API (GENIE-equivalent)

This is the main FastAPI application for the Juicer Chat with Data module.
"""

import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("juicer.app")

# Create FastAPI app
app = FastAPI(
    title="Juicer Chat with Data API",
    description="Natural language interface to Juicer data (GENIE-equivalent)",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and register API routes
from api import register_routes
register_routes(app)

# Serve static files (React app)
static_dir = os.path.join(os.path.dirname(__file__), "ui", "build")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(static_dir, "index.html"))
else:
    logger.warning(f"Static directory {static_dir} not found. UI will not be available.")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

# Run the application
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    
    logger.info(f"Starting Juicer Chat with Data API on port {port}")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)