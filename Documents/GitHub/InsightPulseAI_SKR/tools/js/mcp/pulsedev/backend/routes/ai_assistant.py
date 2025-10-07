"""
AI Assistant API routes for PulseDev

This module provides API endpoints for AI assistance:
- Code explanation and understanding
- Code generation and completion
- Error debugging
- Language-specific assistance
- MCP prompt management
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Optional, Any

from ..services.ai_assistant import ai_assistant_service
from ..services.filesystem import filesystem_service

router = APIRouter(prefix="/api/ai", tags=["ai_assistant"])

# --- Models --- #

class CodeAssistanceRequest(BaseModel):
    query: str
    workspace_id: Optional[str] = None
    file_path: Optional[str] = None
    language: Optional[str] = None
    code_context: Optional[str] = None
    additional_context: Optional[Dict[str, Any]] = None
    prompt_name: Optional[str] = None

class GenerateCodeRequest(BaseModel):
    prompt: str
    language: str
    workspace_id: Optional[str] = None
    file_path: Optional[str] = None
    code_context: Optional[str] = None
    prompt_name: Optional[str] = None

class ExplainCodeRequest(BaseModel):
    code: str
    language: str
    prompt_name: Optional[str] = None

class DebugCodeRequest(BaseModel):
    code: str
    error: str
    language: str
    prompt_name: Optional[str] = None

class SpecializedAssistanceRequest(BaseModel):
    task_type: str
    query: str
    workspace_id: Optional[str] = None
    file_path: Optional[str] = None
    language: Optional[str] = None
    code_context: Optional[str] = None
    additional_context: Optional[Dict[str, Any]] = None

class LoadPromptRequest(BaseModel):
    prompt_name: str

class RecommendPromptRequest(BaseModel):
    query: str
    task_type: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    max_recommendations: Optional[int] = 3

# --- AI Assistant Routes --- #

@router.post("/code-assistance")
async def get_code_assistance(request: CodeAssistanceRequest, background_tasks: BackgroundTasks):
    """Get AI assistance for code-related queries"""
    context = {
        "workspace_id": request.workspace_id,
        "file_path": request.file_path,
        "language": request.language,
        "code_context": request.code_context,
        **(request.additional_context or {})
    }
    
    # If we have workspace_id and file_path, add file content to context
    if request.workspace_id and request.file_path:
        try:
            file_content = await filesystem_service.read_file(request.workspace_id, request.file_path)
            if file_content:
                context["full_file_content"] = file_content
        except:
            pass
    
    # Get assistance
    try:
        result = await ai_assistant_service.get_code_assistance(
            request.query, 
            context, 
            request.prompt_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-code")
async def generate_code(request: GenerateCodeRequest):
    """Generate code based on a prompt"""
    context = {
        "workspace_id": request.workspace_id,
        "file_path": request.file_path,
        "code_context": request.code_context
    }
    
    # If we have workspace_id and file_path, add file content to context
    if request.workspace_id and request.file_path:
        try:
            file_content = await filesystem_service.read_file(request.workspace_id, request.file_path)
            if file_content:
                context["full_file_content"] = file_content
        except:
            pass
    
    # Generate code
    try:
        result = await ai_assistant_service.generate_code(
            request.prompt, 
            request.language, 
            context, 
            request.prompt_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/explain-code")
async def explain_code(request: ExplainCodeRequest):
    """Explain a code snippet"""
    try:
        result = await ai_assistant_service.explain_code(
            request.code, 
            request.language, 
            request.prompt_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/debug-code")
async def debug_code(request: DebugCodeRequest):
    """Debug code with an error"""
    try:
        result = await ai_assistant_service.debug_code(
            request.code, 
            request.error, 
            request.language, 
            request.prompt_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/specialized-assistance")
async def get_specialized_assistance(request: SpecializedAssistanceRequest):
    """Get specialized assistance by task type"""
    context = {
        "workspace_id": request.workspace_id,
        "file_path": request.file_path,
        "language": request.language,
        "code_context": request.code_context,
        **(request.additional_context or {})
    }
    
    # If we have workspace_id and file_path, add file content to context
    if request.workspace_id and request.file_path:
        try:
            file_content = await filesystem_service.read_file(request.workspace_id, request.file_path)
            if file_content:
                context["full_file_content"] = file_content
        except:
            pass
    
    # Get specialized assistance
    try:
        result = await ai_assistant_service.get_specialized_assistance(
            request.task_type,
            request.query,
            context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Prompt Management Routes --- #

@router.get("/prompts")
async def get_prompts(include_metadata: bool = False, access_level: Optional[str] = None):
    """Get a list of available MCP prompts"""
    try:
        prompts = ai_assistant_service.get_available_prompts(include_metadata, access_level)
        return {
            "prompts": prompts,
            "active_prompt": ai_assistant_service.get_active_prompt()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.post("/prompts/recommend")
async def recommend_prompt(request: RecommendPromptRequest):
    """Recommend prompts based on query and task type"""
    try:
        # Get all prompts with metadata
        all_prompts = ai_assistant_service.get_available_prompts(include_metadata=True)
        
        # Extract prompt hint from query if available
        prompt_hint = await ai_assistant_service.extract_prompt_hint(request.query)
        
        # Prepare scoring system
        scores = []
        
        for prompt in all_prompts:
            # Skip prompts without metadata
            if not isinstance(prompt, dict) or not prompt.get("metadata"):
                continue
                
            score = 0
            metadata = prompt["metadata"]
            prompt_name = prompt["name"]
            
            # 1. Direct hint match (+100)
            if prompt_hint and prompt_hint.lower() in prompt_name.lower():
                score += 100
                
            # 2. Task type match (+80)
            if request.task_type:
                # Check if task type matches any aliases
                aliases = metadata.get("aliases", [])
                if request.task_type.lower() in [a.lower() for a in aliases]:
                    score += 80
                    
            # 3. Capability matching based on query (+1-40 depending on relevance)
            capabilities = metadata.get("capabilities", [])
            for capability in capabilities:
                # Convert capability to lowercase words for matching
                capability_words = capability.lower().replace('"', '').replace("'", "").split()
                for word in capability_words:
                    if word in request.query.lower() and len(word) > 3:  # Only match significant words
                        score += 10
            
            # 4. Use case matching based on context (+1-20 depending on relevance)
            use_cases = metadata.get("use_cases", [])
            for use_case in use_cases:
                use_case_words = use_case.lower().replace('"', '').replace("'", "").split()
                for word in use_case_words:
                    if word in request.query.lower() and len(word) > 3:  # Only match significant words
                        score += 5
                        
            # 5. Default fallback score for combined prompt
            if "combined" in prompt_name:
                score += 10  # Ensure it's always considered
                
            scores.append({"name": prompt_name, "score": score, "metadata": metadata})
        
        # Sort by score descending and take top N
        scores.sort(key=lambda x: x["score"], reverse=True)
        top_recommendations = scores[:request.max_recommendations]
        
        return {
            "recommendations": top_recommendations,
            "query": request.query,
            "task_type": request.task_type,
            "prompt_hint": prompt_hint
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prompts/{prompt_name}")
async def get_prompt_info(prompt_name: str):
    """Get information about a specific prompt"""
    try:
        info = ai_assistant_service.get_prompt_info(prompt_name)
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/prompts/load")
async def load_prompt(request: LoadPromptRequest):
    """Load and activate a specific prompt"""
    try:
        success = await ai_assistant_service.load_prompt(request.prompt_name)
        if not success:
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to load prompt: {request.prompt_name}"
            )
        return {
            "status": "success",
            "active_prompt": ai_assistant_service.get_active_prompt()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Service Health Check --- #

@router.get("/status")
async def get_ai_status(detail: bool = False):
    """Check if the AI service is available"""
    try:
        # Try to connect if not already connected
        if not ai_assistant_service.connected:
            await ai_assistant_service.connect()
        
        response = {
            "status": "connected" if ai_assistant_service.connected else "disconnected",
            "service": "MCP AI Assistant",
            "active_prompt": ai_assistant_service.get_active_prompt()
        }
        
        # Add additional details if requested
        if detail:
            active_prompt_info = ai_assistant_service.get_prompt_info(
                ai_assistant_service.get_active_prompt()
            ) if ai_assistant_service.get_active_prompt() else {}
            
            response.update({
                "model": "claude",  # This could be dynamic in the future
                "prompt_details": active_prompt_info,
                "available_prompts_count": len(ai_assistant_service.get_available_prompts()),
                "memory_state": "stateless"  # Could be updated if we add memory
            })
        
        return response
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "service": "MCP AI Assistant"
        }