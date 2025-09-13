"""
File System Service for PulseDev

This module provides a virtualized file system for PulseDev workspaces,
implementing operations for file manipulation, directory management, and
workspace persistence.
"""

import os
import shutil
import json
import uuid
import asyncio
from typing import Dict, List, Optional, Union
from pathlib import Path
from datetime import datetime
import aiofiles

# Base directory for all workspaces
WORKSPACE_ROOT = Path("/tmp/pulsedev_workspaces")

class FileSystemService:
    """Service for managing virtual file systems for workspaces"""
    
    def __init__(self):
        """Initialize the file system service"""
        WORKSPACE_ROOT.mkdir(exist_ok=True, parents=True)
        self.workspaces = {}
        self._load_workspace_metadata()
    
    def _load_workspace_metadata(self):
        """Load metadata for existing workspaces"""
        for workspace_dir in WORKSPACE_ROOT.iterdir():
            if workspace_dir.is_dir():
                metadata_file = workspace_dir / "metadata.json"
                if metadata_file.exists():
                    try:
                        with open(metadata_file, "r") as f:
                            metadata = json.load(f)
                            self.workspaces[workspace_dir.name] = metadata
                    except Exception as e:
                        print(f"Error loading workspace metadata for {workspace_dir.name}: {e}")
    
    async def create_workspace(self, name: str, description: str = "", template: str = "blank") -> Dict:
        """
        Create a new workspace
        
        Args:
            name: Name of the workspace
            description: Optional description
            template: Template to use (blank, node, python, etc.)
            
        Returns:
            Workspace metadata
        """
        workspace_id = str(uuid.uuid4())
        workspace_path = WORKSPACE_ROOT / workspace_id
        workspace_path.mkdir(exist_ok=True, parents=True)
        
        # Create metadata
        metadata = {
            "id": workspace_id,
            "name": name,
            "description": description,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "template": template,
            "owner": "default_user"  # In a real app, this would come from auth
        }
        
        # Save metadata
        async with aiofiles.open(workspace_path / "metadata.json", "w") as f:
            await f.write(json.dumps(metadata, indent=2))
        
        # Apply template if not blank
        if template != "blank":
            await self._apply_template(workspace_id, template)
        
        self.workspaces[workspace_id] = metadata
        return metadata
    
    async def _apply_template(self, workspace_id: str, template: str):
        """Apply a template to a workspace"""
        workspace_path = WORKSPACE_ROOT / workspace_id
        
        # Template definitions
        templates = {
            "node": {
                "files": {
                    "index.js": "console.log('Hello from PulseDev!');\n",
                    "package.json": json.dumps({
                        "name": "pulsedev-project",
                        "version": "1.0.0",
                        "description": "A PulseDev project",
                        "main": "index.js",
                        "scripts": {
                            "start": "node index.js"
                        }
                    }, indent=2)
                }
            },
            "python": {
                "files": {
                    "main.py": "print('Hello from PulseDev!')\n",
                    "requirements.txt": ""
                }
            },
            "react": {
                "files": {
                    "index.js": "import React from 'react';\nimport ReactDOM from 'react-dom';\nimport App from './App';\n\nReactDOM.render(<App />, document.getElementById('root'));\n",
                    "App.js": "import React from 'react';\n\nfunction App() {\n  return (\n    <div className=\"App\">\n      <h1>Hello from PulseDev React!</h1>\n    </div>\n  );\n}\n\nexport default App;\n",
                    "package.json": json.dumps({
                        "name": "pulsedev-react",
                        "version": "1.0.0",
                        "description": "A PulseDev React project",
                        "dependencies": {
                            "react": "^17.0.2",
                            "react-dom": "^17.0.2"
                        }
                    }, indent=2)
                }
            }
        }
        
        if template in templates:
            for file_path, content in templates[template]["files"].items():
                full_path = workspace_path / file_path
                
                # Create parent directories if needed
                full_path.parent.mkdir(exist_ok=True, parents=True)
                
                async with aiofiles.open(full_path, "w") as f:
                    await f.write(content)
    
    async def delete_workspace(self, workspace_id: str) -> bool:
        """Delete a workspace and all its contents"""
        if workspace_id not in self.workspaces:
            return False
        
        workspace_path = WORKSPACE_ROOT / workspace_id
        if workspace_path.exists():
            shutil.rmtree(workspace_path)
        
        del self.workspaces[workspace_id]
        return True
    
    async def list_workspaces(self) -> List[Dict]:
        """List all workspaces"""
        return list(self.workspaces.values())
    
    async def get_workspace(self, workspace_id: str) -> Optional[Dict]:
        """Get workspace metadata"""
        return self.workspaces.get(workspace_id)
    
    async def list_files(self, workspace_id: str, path: str = "") -> List[Dict]:
        """
        List files in a workspace directory
        
        Args:
            workspace_id: ID of the workspace
            path: Relative path within the workspace
            
        Returns:
            List of file metadata
        """
        if workspace_id not in self.workspaces:
            return []
        
        workspace_path = WORKSPACE_ROOT / workspace_id
        target_path = workspace_path / path
        
        if not target_path.exists() or not target_path.is_dir():
            return []
        
        files = []
        for item in target_path.iterdir():
            # Skip metadata file
            if item.name == "metadata.json" and path == "":
                continue
                
            files.append({
                "name": item.name,
                "path": str(item.relative_to(workspace_path)),
                "type": "directory" if item.is_dir() else "file",
                "size": item.stat().st_size if item.is_file() else 0,
                "modified": datetime.fromtimestamp(item.stat().st_mtime).isoformat()
            })
        
        return files
    
    async def read_file(self, workspace_id: str, path: str) -> Optional[str]:
        """Read file content from a workspace"""
        if workspace_id not in self.workspaces:
            return None
        
        file_path = WORKSPACE_ROOT / workspace_id / path
        if not file_path.exists() or not file_path.is_file():
            return None
        
        try:
            async with aiofiles.open(file_path, "r") as f:
                return await f.read()
        except UnicodeDecodeError:
            # For binary files, we could handle differently
            return None
    
    async def write_file(self, workspace_id: str, path: str, content: str) -> bool:
        """Write content to a file in a workspace"""
        if workspace_id not in self.workspaces:
            return False
        
        file_path = WORKSPACE_ROOT / workspace_id / path
        
        # Create parent directories if they don't exist
        file_path.parent.mkdir(exist_ok=True, parents=True)
        
        try:
            async with aiofiles.open(file_path, "w") as f:
                await f.write(content)
                
            # Update workspace metadata
            self.workspaces[workspace_id]["updated_at"] = datetime.now().isoformat()
            metadata_path = WORKSPACE_ROOT / workspace_id / "metadata.json"
            async with aiofiles.open(metadata_path, "w") as f:
                await f.write(json.dumps(self.workspaces[workspace_id], indent=2))
                
            return True
        except Exception as e:
            print(f"Error writing file {path}: {e}")
            return False
    
    async def delete_file(self, workspace_id: str, path: str) -> bool:
        """Delete a file or directory from a workspace"""
        if workspace_id not in self.workspaces:
            return False
        
        target_path = WORKSPACE_ROOT / workspace_id / path
        if not target_path.exists():
            return False
        
        try:
            if target_path.is_dir():
                shutil.rmtree(target_path)
            else:
                os.remove(target_path)
                
            # Update workspace metadata
            self.workspaces[workspace_id]["updated_at"] = datetime.now().isoformat()
            metadata_path = WORKSPACE_ROOT / workspace_id / "metadata.json"
            async with aiofiles.open(metadata_path, "w") as f:
                await f.write(json.dumps(self.workspaces[workspace_id], indent=2))
                
            return True
        except Exception as e:
            print(f"Error deleting {path}: {e}")
            return False
    
    async def create_directory(self, workspace_id: str, path: str) -> bool:
        """Create a directory in a workspace"""
        if workspace_id not in self.workspaces:
            return False
        
        dir_path = WORKSPACE_ROOT / workspace_id / path
        
        try:
            dir_path.mkdir(exist_ok=True, parents=True)
            return True
        except Exception as e:
            print(f"Error creating directory {path}: {e}")
            return False
    
    async def rename_file(self, workspace_id: str, old_path: str, new_path: str) -> bool:
        """Rename/move a file or directory within a workspace"""
        if workspace_id not in self.workspaces:
            return False
        
        old_file_path = WORKSPACE_ROOT / workspace_id / old_path
        new_file_path = WORKSPACE_ROOT / workspace_id / new_path
        
        if not old_file_path.exists():
            return False
        
        try:
            # Create parent directories if they don't exist
            new_file_path.parent.mkdir(exist_ok=True, parents=True)
            
            # Move the file/directory
            shutil.move(str(old_file_path), str(new_file_path))
            
            # Update workspace metadata
            self.workspaces[workspace_id]["updated_at"] = datetime.now().isoformat()
            metadata_path = WORKSPACE_ROOT / workspace_id / "metadata.json"
            async with aiofiles.open(metadata_path, "w") as f:
                await f.write(json.dumps(self.workspaces[workspace_id], indent=2))
                
            return True
        except Exception as e:
            print(f"Error renaming {old_path} to {new_path}: {e}")
            return False

    async def export_workspace(self, workspace_id: str) -> Optional[str]:
        """
        Export a workspace as a zip file
        
        Returns:
            Path to the zip file or None if error
        """
        if workspace_id not in self.workspaces:
            return None
        
        workspace_path = WORKSPACE_ROOT / workspace_id
        if not workspace_path.exists():
            return None
        
        export_filename = f"pulsedev_export_{workspace_id}.zip"
        export_path = Path("/tmp") / export_filename
        
        try:
            # Create a zip file excluding metadata
            shutil.make_archive(
                str(export_path).replace(".zip", ""),
                'zip',
                str(workspace_path),
                logger=None
            )
            
            return str(export_path)
        except Exception as e:
            print(f"Error exporting workspace {workspace_id}: {e}")
            return None
    
    async def import_workspace(self, name: str, zip_path: str, description: str = "") -> Optional[Dict]:
        """
        Import a workspace from a zip file
        
        Args:
            name: Name for the new workspace
            zip_path: Path to the zip file
            description: Optional description
            
        Returns:
            Workspace metadata or None if error
        """
        try:
            # Create a new workspace
            workspace = await self.create_workspace(name, description)
            workspace_id = workspace["id"]
            workspace_path = WORKSPACE_ROOT / workspace_id
            
            # Extract the zip file
            shutil.unpack_archive(zip_path, str(workspace_path))
            
            return workspace
        except Exception as e:
            print(f"Error importing workspace from {zip_path}: {e}")
            return None

# Create a singleton instance
filesystem_service = FileSystemService()