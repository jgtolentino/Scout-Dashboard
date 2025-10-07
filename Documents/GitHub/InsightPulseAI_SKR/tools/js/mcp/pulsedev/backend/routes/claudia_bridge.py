"""
Claudia Bridge API routes for PulseDev

This module provides API endpoints for Claudia orchestration integration:
- Task execution with prompt selection
- Metrics and telemetry for prompt usage
- Kalaw knowledge integration
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Optional, Any

from ..services.claudia_mcp_bridge import claudia_mcp_bridge
from ..services.ai_assistant import ai_assistant_service

router = APIRouter(prefix="/api/claudia", tags=["claudia_bridge"])

# --- Models --- #

class TaskRequest(BaseModel):
    task_description: str
    prompt_name: Optional[str] = None
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class PromptSwitchRequest(BaseModel):
    task_description: str
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class KalawIndexRequest(BaseModel):
    document_id: str
    document_type: str
    metadata: Dict[str, Any]
    content: Optional[str] = None

# --- Claudia Bridge Routes --- #

@router.post("/task")
async def execute_task(request: TaskRequest):
    """Execute a task with auto or manual prompt selection"""
    try:
        result = await claudia_mcp_bridge.execute_task_with_prompt(
            task_description=request.task_description,
            prompt_name=request.prompt_name,
            session_id=request.session_id,
            context=request.context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/switch")
async def switch_prompt(request: PromptSwitchRequest):
    """Switch to appropriate prompt for task"""
    try:
        result = await claudia_mcp_bridge.switch_prompt_for_task(
            task_description=request.task_description,
            session_id=request.session_id,
            context=request.context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics")
async def get_metrics():
    """Get prompt usage metrics"""
    try:
        metrics = await claudia_mcp_bridge.get_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Kalaw Integration Routes --- #

@router.get("/kalaw/concepts")
async def get_kalaw_concepts():
    """Get prompt concepts from Kalaw index"""
    try:
        concepts = claudia_mcp_bridge.get_kalaw_concepts()
        return {"concepts": concepts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/kalaw/components")
async def get_kalaw_components():
    """Get prompt components from Kalaw index"""
    try:
        components = claudia_mcp_bridge.get_kalaw_components()
        return {"components": components}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/kalaw/index")
async def index_with_kalaw(request: KalawIndexRequest):
    """Index a document with Kalaw"""
    try:
        # Simple mock implementation - in a real system, this would call Kalaw's indexing API
        return {
            "status": "indexed",
            "document_id": request.document_id,
            "timestamp": "2025-05-14T20:00:00Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Integration Status --- #

@router.get("/status")
async def get_claudia_status():
    """Get Claudia bridge status"""
    try:
        metrics = await claudia_mcp_bridge.get_metrics()
        ai_status = await ai_assistant_service.get_code_assistance(
            "What is your current status?",
            {"context_type": "system_check"}
        )
        
        return {
            "claudia_bridge": {
                "status": "connected",
                "session_id": metrics.get("session_id"),
                "last_sync": metrics.get("last_sync"),
                "total_requests": metrics.get("metrics", {}).get("total_requests", 0)
            },
            "mcp_status": {
                "connected": ai_assistant_service.connected,
                "active_prompt": ai_assistant_service.get_active_prompt()
            },
            "kalaw_status": {
                "indexed_components": len(claudia_mcp_bridge.get_kalaw_components()),
                "indexed_concepts": len(claudia_mcp_bridge.get_kalaw_concepts())
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }