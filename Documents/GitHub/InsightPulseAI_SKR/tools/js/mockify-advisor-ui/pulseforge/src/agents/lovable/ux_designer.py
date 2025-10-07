"""
Lovable UX Designer

This module provides UX/UI design recommendations and enhancements for
generated applications. It applies user-centered design principles and
best practices to improve the usability, accessibility, and aesthetics
of the UI.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

from core.system_prompts import get_agent_prompt
from core.llm import LLMClient, ModelProvider

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class UXDesigner:
    """
    UX/UI design specialist that provides recommendations and enhancements
    for generated applications.
    """
    
    def __init__(
        self,
        llm_client: Optional[LLMClient] = None,
        system_prompt: Optional[str] = None
    ):
        """
        Initialize the UX Designer.
        
        Args:
            llm_client: Optional LLM client for design recommendations
            system_prompt: Optional system prompt for the UX designer
        """
        self.llm_client = llm_client or LLMClient(
            provider=ModelProvider.ANTHROPIC,
            model_name="claude-3-sonnet-20240229",
            api_key=os.environ.get("ANTHROPIC_API_KEY", "")
        )
        
        self.system_prompt = system_prompt or get_agent_prompt("lovable")
        logger.info(f"UX Designer initialized with system prompt of length {len(self.system_prompt or '')}")
    
    def enhance_prompt(self, prompt: str) -> str:
        """
        Enhance a generation prompt with UX/UI design principles.
        
        Args:
            prompt: Original prompt
            
        Returns:
            Enhanced prompt with UX focus
        """
        # In a real implementation, this would use the LLM to enhance the prompt
        # For demo purposes, we'll add UX-focused requirements
        
        ux_additions = [
            "Ensure the UI follows accessibility standards (WCAG 2.1 AA).",
            "Apply a consistent color scheme and visual hierarchy.",
            "Implement responsive design for all screen sizes.",
            "Use appropriate form validation with helpful error messages.",
            "Optimize loading states and provide feedback during operations.",
            "Design with user-centered principles in mind."
        ]
        
        enhanced_prompt = f"{prompt}\n\nUX/UI Requirements:\n"
        enhanced_prompt += "\n".join([f"- {addition}" for addition in ux_additions])
        
        logger.info("Enhanced prompt with UX/UI requirements")
        return enhanced_prompt
    
    def analyze_frontend_code(self, codebase_path: str) -> Dict[str, Any]:
        """
        Analyze frontend code for UX/UI improvements.
        
        Args:
            codebase_path: Path to the generated codebase
            
        Returns:
            Dictionary with UX analysis and recommendations
        """
        frontend_path = Path(codebase_path) / "frontend"
        if not frontend_path.exists():
            logger.warning(f"Frontend directory not found at {frontend_path}")
            return {"error": "Frontend directory not found"}
        
        # In a real implementation, this would use the LLM to analyze the code
        # For demo purposes, we'll return some generic recommendations
        
        return {
            "status": "success",
            "accessibility_score": 0.78,
            "usability_score": 0.82,
            "responsiveness_score": 0.85,
            "recommendations": [
                {
                    "category": "accessibility",
                    "description": "Add aria-labels to interactive elements",
                    "severity": "medium",
                    "affected_files": ["components/Button.js", "components/Form.js"]
                },
                {
                    "category": "usability",
                    "description": "Improve form error handling with inline validation",
                    "severity": "high",
                    "affected_files": ["components/Form.js"]
                },
                {
                    "category": "performance",
                    "description": "Implement lazy loading for images",
                    "severity": "low",
                    "affected_files": ["components/ImageGallery.js"]
                }
            ]
        }
    
    def suggest_ui_improvements(
        self,
        app_description: str,
        tech_stack: str,
        target_audience: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Suggest UI improvements based on app description.
        
        Args:
            app_description: Description of the application
            tech_stack: Technology stack used
            target_audience: Optional target audience description
            
        Returns:
            Dictionary with UI improvement suggestions
        """
        # In a real implementation, this would use the LLM to generate suggestions
        # For demo purposes, we'll return some generic suggestions
        
        ui_frameworks = {
            "react": ["Material-UI", "Chakra UI", "Tailwind CSS"],
            "vue": ["Vuetify", "Quasar", "Tailwind CSS"],
            "angular": ["Angular Material", "PrimeNG", "Tailwind CSS"]
        }
        
        # Determine frontend framework from tech stack
        frontend = tech_stack.split("-")[0] if "-" in tech_stack else "react"
        frameworks = ui_frameworks.get(frontend, ui_frameworks["react"])
        
        return {
            "color_scheme_suggestions": [
                {
                    "name": "Modern Professional",
                    "primary": "#3B82F6",
                    "secondary": "#10B981",
                    "background": "#F9FAFB",
                    "text": "#1F2937"
                },
                {
                    "name": "Bold Contrast",
                    "primary": "#8B5CF6",
                    "secondary": "#EC4899",
                    "background": "#FFFFFF",
                    "text": "#111827"
                }
            ],
            "recommended_ui_frameworks": frameworks,
            "component_recommendations": [
                {
                    "type": "navigation",
                    "suggestion": "Use a responsive sidebar with collapsible sections"
                },
                {
                    "type": "forms",
                    "suggestion": "Implement multi-step forms with progress indicators"
                },
                {
                    "type": "data_display",
                    "suggestion": "Use responsive data tables with sorting and filtering"
                }
            ],
            "accessibility_tips": [
                "Ensure sufficient color contrast (minimum 4.5:1)",
                "Provide text alternatives for non-text content",
                "Ensure keyboard navigability for all interactive elements"
            ]
        }
    
    def apply_design_system(
        self,
        codebase_path: str,
        design_system: str = "material"
    ) -> bool:
        """
        Apply a design system to a generated frontend.
        
        Args:
            codebase_path: Path to the generated codebase
            design_system: Design system to apply (material, bootstrap, etc.)
            
        Returns:
            True if successful, False otherwise
        """
        frontend_path = Path(codebase_path) / "frontend"
        if not frontend_path.exists():
            logger.warning(f"Frontend directory not found at {frontend_path}")
            return False
        
        # In a real implementation, this would modify the frontend code
        # to apply the design system. For demo purposes, we'll just log it.
        
        logger.info(f"Applied {design_system} design system to {codebase_path}")
        
        # Create a marker file to indicate the design system was applied
        design_marker = frontend_path / ".design_system"
        design_marker.write_text(design_system)
        
        return True


# Create a singleton instance
_ux_designer = None

def get_ux_designer() -> UXDesigner:
    """
    Get the singleton UX Designer instance.
    
    Returns:
        UX Designer instance
    """
    global _ux_designer
    
    if _ux_designer is None:
        _ux_designer = UXDesigner()
    
    return _ux_designer