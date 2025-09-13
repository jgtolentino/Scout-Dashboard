"""
Juicer API Package

This package provides the FastAPI endpoints for the Juicer system,
including the Chat with Data module (GENIE-equivalent).
"""

from fastapi import FastAPI, APIRouter
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Create router
router = APIRouter()

# Import routers
from .query_endpoint import router as query_router

# Register routers
router.include_router(query_router)

# Function to add routes to main app
def register_routes(app: FastAPI):
    """Register all routes with the main FastAPI app"""
    app.include_router(router)
    return app