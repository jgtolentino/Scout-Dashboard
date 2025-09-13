"""
Workspace API routes for PulseDev

This module provides API endpoints for workspace management, including:
- Workspace creation and deletion
- File and directory operations
- Workspace import/export
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import tempfile
import os
from pathlib import Path

from ..services.filesystem import filesystem_service

router = APIRouter(prefix="/api/workspace", tags=["workspace"])

# --- Models --- #

class WorkspaceCreate(BaseModel):
    name: str
    description: str = ""
    template: str = "blank"

class FileWrite(BaseModel):
    content: str

class FileRename(BaseModel):
    new_path: str

class DirectoryCreate(BaseModel):
    path: str

# --- Workspace routes --- #

@router.post("/", status_code=201)
async def create_workspace(workspace: WorkspaceCreate):
    """Create a new workspace"""
    result = await filesystem_service.create_workspace(
        workspace.name, workspace.description, workspace.template
    )
    if not result:
        raise HTTPException(status_code=400, detail="Failed to create workspace")
    return result

@router.get("/")
async def list_workspaces():
    """List all workspaces"""
    return await filesystem_service.list_workspaces()

@router.get("/{workspace_id}")
async def get_workspace(workspace_id: str):
    """Get workspace metadata"""
    workspace = await filesystem_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace

@router.delete("/{workspace_id}")
async def delete_workspace(workspace_id: str):
    """Delete a workspace"""
    success = await filesystem_service.delete_workspace(workspace_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return {"success": True}

# --- File operations --- #

@router.get("/{workspace_id}/files")
async def list_files(workspace_id: str, path: str = ""):
    """List files in a workspace directory"""
    workspace = await filesystem_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    files = await filesystem_service.list_files(workspace_id, path)
    return files

@router.get("/{workspace_id}/files/{path:path}")
async def read_file(workspace_id: str, path: str):
    """Read file content"""
    workspace = await filesystem_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    content = await filesystem_service.read_file(workspace_id, path)
    if content is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"content": content}

@router.put("/{workspace_id}/files/{path:path}")
async def write_file(workspace_id: str, path: str, file_data: FileWrite):
    """Write content to a file"""
    workspace = await filesystem_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    success = await filesystem_service.write_file(workspace_id, path, file_data.content)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to write file")
    
    return {"success": True}

@router.delete("/{workspace_id}/files/{path:path}")
async def delete_file(workspace_id: str, path: str):
    """Delete a file or directory"""
    workspace = await filesystem_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    success = await filesystem_service.delete_file(workspace_id, path)
    if not success:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"success": True}

@router.post("/{workspace_id}/files/{path:path}")
async def rename_file(workspace_id: str, path: str, rename_data: FileRename):
    """Rename/move a file or directory"""
    workspace = await filesystem_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    success = await filesystem_service.rename_file(workspace_id, path, rename_data.new_path)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to rename file")
    
    return {"success": True}

@router.post("/{workspace_id}/directories")
async def create_directory(workspace_id: str, directory_data: DirectoryCreate):
    """Create a directory"""
    workspace = await filesystem_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    success = await filesystem_service.create_directory(workspace_id, directory_data.path)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to create directory")
    
    return {"success": True}

# --- Import/Export --- #

@router.get("/{workspace_id}/export")
async def export_workspace(workspace_id: str, background_tasks: BackgroundTasks):
    """Export a workspace as a zip file"""
    workspace = await filesystem_service.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    export_path = await filesystem_service.export_workspace(workspace_id)
    if not export_path:
        raise HTTPException(status_code=400, detail="Failed to export workspace")
    
    # Register cleanup task
    background_tasks.add_task(lambda: os.remove(export_path) if os.path.exists(export_path) else None)
    
    return FileResponse(
        path=export_path,
        filename=f"{workspace['name']}.zip",
        media_type="application/zip"
    )

@router.post("/import")
async def import_workspace(
    name: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...)
):
    """Import a workspace from a zip file"""
    # Save the uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    try:
        # Import the workspace
        workspace = await filesystem_service.import_workspace(name, temp_file_path, description)
        if not workspace:
            raise HTTPException(status_code=400, detail="Failed to import workspace")
        
        return workspace
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)