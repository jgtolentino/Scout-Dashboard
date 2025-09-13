"""
MCP Orchestrator API - Main FastAPI application
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import uvicorn

# Import route modules
from routes import workspace, terminal, collaboration, ai_assistant, slideforge

# Create FastAPI app
app = FastAPI(
    title="MCP Orchestrator API",
    description="Backend API for MCP-based applications",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Generic error handler
@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

# Register routes from modules
workspace.register_routes(app)
terminal.register_routes(app)
collaboration.register_routes(app)
ai_assistant.register_routes(app)
slideforge.register_routes(app)

# Mount static files if directories exist
if os.path.exists("./public"):
    app.mount("/", StaticFiles(directory="./public", html=True), name="public")

if os.path.exists("./slides"):
    app.mount("/slides", StaticFiles(directory="./slides", html=True), name="slides")

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8000))
    
    # Run the application
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)