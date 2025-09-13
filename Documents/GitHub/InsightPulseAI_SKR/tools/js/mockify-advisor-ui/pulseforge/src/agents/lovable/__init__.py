"""
Lovable Agent Package

This package provides the Lovable UX/UI design and application cloning capabilities.
It allows users to clone and modify previously generated applications with an
emphasis on UX/UI best practices and user-centered design.

Core components:
- clone_manager: Handles the storage and retrieval of application designs
- ux_designer: Provides UX/UI design recommendations and enhancements
"""

from .clone_manager import (
    CloneRequest, 
    LovableCloneManager, 
    get_clone_manager
)

from .ux_designer import (
    UXDesigner,
    get_ux_designer
)

__all__ = [
    'CloneRequest',
    'LovableCloneManager',
    'get_clone_manager',
    'UXDesigner',
    'get_ux_designer'
]