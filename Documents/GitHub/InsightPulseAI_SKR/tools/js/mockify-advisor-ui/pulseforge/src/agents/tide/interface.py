"""
PulseForge Interface Module

This module provides a unified interface for the PulseForge app generation pipeline,
connecting prompt parsing, schema management, and app generation under a single 
orchestration contract.
"""

import os
import json
import logging
import uuid
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path

from core.schema import AppSpecification, Entity, Relationship, Feature, BusinessRule
from core.llm import LLMClient, ModelProvider

from .prompt_parser import PromptParser, parse_prompt, save_specification
from .app_generator import AppGenerator, generate_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class GenerationRequest:
    """Request for app generation from prompt to codebase."""
    prompt: str
    target_stack: str = "react-fastapi-postgres"  # default stack
    auth_required: bool = True
    output_dir: str = "./output"
    template_id: Optional[str] = None
    features: List[str] = field(default_factory=list)
    model_provider: str = "openai"
    model_name: str = "gpt-4-1106-preview"
    request_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GenerationRequest':
        """Create from dictionary representation."""
        return cls(**data)


@dataclass
class GenerationResponse:
    """Response from app generation process."""
    codebase_path: str
    specification: Dict[str, Any]
    request_id: str
    target_stack: str
    completion_time: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)
    status: str = "success"
    error: Optional[str] = None
    validation_results: Optional[Dict[str, Any]] = None
    deployment_info: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        result = asdict(self)
        result["completion_time"] = result["completion_time"].isoformat()
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GenerationResponse':
        """Create from dictionary representation."""
        if isinstance(data["completion_time"], str):
            data["completion_time"] = datetime.fromisoformat(data["completion_time"])
        return cls(**data)
    
    def save(self, output_path: Optional[str] = None) -> str:
        """
        Save the response to a file.
        
        Args:
            output_path: Path to save to (if None, uses default path)
            
        Returns:
            Path to saved file
        """
        if output_path is None:
            output_dir = Path("./pulseforge_outputs")
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = output_dir / f"response_{self.request_id}.json"
        
        with open(output_path, "w") as f:
            json.dump(self.to_dict(), f, indent=2)
        
        logger.info(f"Generation response saved to {output_path}")
        return str(output_path)


class PulseForgeInterface:
    """
    Unified interface for the PulseForge app generation pipeline.
    
    This class coordinates the flow from natural language prompt to
    generated application codebase, handling:
    
    1. Prompt parsing to structured specification
    2. Schema management and validation
    3. Application code generation
    4. Optional validation and deployment
    """
    
    def __init__(
        self,
        llm_client: Optional[LLMClient] = None,
        output_base_dir: str = "./output",
        enable_validation: bool = True,
        enable_telemetry: bool = True
    ):
        """
        Initialize the PulseForge interface.
        
        Args:
            llm_client: LLM client to use (creates default if None)
            output_base_dir: Base directory for output
            enable_validation: Whether to validate generated code
            enable_telemetry: Whether to collect telemetry
        """
        self.llm_client = llm_client or LLMClient()
        self.output_base_dir = Path(output_base_dir)
        self.output_base_dir.mkdir(parents=True, exist_ok=True)
        self.enable_validation = enable_validation
        self.enable_telemetry = enable_telemetry
        
        # Initialize components
        self.prompt_parser = PromptParser(llm_client=self.llm_client)
        
        # Metrics
        self.generation_count = 0
        self.total_tokens_used = 0
        self.generation_times = []
    
    def generate_from_prompt(self, request: Union[GenerationRequest, Dict[str, Any]]) -> GenerationResponse:
        """
        Generate application from prompt.
        
        Args:
            request: Generation request or dictionary with request parameters
            
        Returns:
            Generation response with codebase path and metadata
        """
        # Start timing
        start_time = datetime.now()
        
        # Normalize request
        if isinstance(request, dict):
            request = GenerationRequest.from_dict(request)
        
        # Create output directory for this request
        request_dir = self.output_base_dir / f"pulseforge_{request.request_id}"
        request_dir.mkdir(parents=True, exist_ok=True)
        
        # Save request
        request_path = request_dir / "request.json"
        with open(request_path, "w") as f:
            json.dump(request.to_dict(), f, indent=2)
        
        logger.info(f"Processing generation request {request.request_id}")
        logger.info(f"Prompt: {request.prompt[:100]}...")
        
        try:
            # Parse prompt to specification
            logger.info("Parsing prompt to specification...")
            
            # Configure LLM client based on request
            self.llm_client = LLMClient(
                provider=request.model_provider,
                model=request.model_name
            )
            self.prompt_parser = PromptParser(llm_client=self.llm_client)
            
            # Parse prompt
            app_spec = self.prompt_parser.parse_prompt(request.prompt)
            
            # Add auth feature if required
            if request.auth_required and not any(f.name == "authentication" for f in app_spec.features):
                app_spec.features.append(Feature(
                    name="authentication",
                    description="User authentication and authorization",
                    required=True
                ))
            
            # Add requested features
            for feature_name in request.features:
                if not any(f.name == feature_name for f in app_spec.features):
                    app_spec.features.append(Feature(
                        name=feature_name,
                        description=f"{feature_name.replace('_', ' ').capitalize()} functionality",
                        required=False
                    ))
            
            # Save specification
            spec_path = request_dir / "specification.json"
            with open(spec_path, "w") as f:
                json.dump(app_spec.to_dict(), f, indent=2)
            
            logger.info(f"Specification saved to {spec_path}")
            
            # Parse target stack
            stack_parts = request.target_stack.split("-")
            if len(stack_parts) != 3:
                raise ValueError(f"Invalid target stack: {request.target_stack}. Expected format: frontend-backend-database")
            
            frontend, backend, database = stack_parts
            
            # Generate application code
            logger.info(f"Generating application with stack: {frontend}-{backend}-{database}")
            generator = AppGenerator(
                spec=app_spec,
                output_dir=str(request_dir),
                frontend_framework=frontend,
                backend_framework=backend,
                database=database,
                llm_client=self.llm_client
            )
            
            codebase_path = generator.generate()
            
            # Optional: Validate generated code
            validation_results = None
            if self.enable_validation:
                logger.info("Validating generated code...")
                validation_results = self._validate_generated_code(codebase_path)
            
            # Calculate duration
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            self.generation_times.append(duration)
            
            # Track metrics
            self.generation_count += 1
            
            # Create and return response
            response = GenerationResponse(
                codebase_path=codebase_path,
                specification=app_spec.to_dict(),
                request_id=request.request_id,
                target_stack=request.target_stack,
                completion_time=end_time,
                metadata={
                    "duration_seconds": duration,
                    "entity_count": len(app_spec.entities),
                    "relationship_count": len(app_spec.relationships),
                    "feature_count": len(app_spec.features),
                    "prompt_length": len(request.prompt),
                    "frontend": frontend,
                    "backend": backend,
                    "database": database
                },
                validation_results=validation_results
            )
            
            # Save response
            response_path = request_dir / "response.json"
            response.save(response_path)
            
            logger.info(f"Application generated successfully at {codebase_path}")
            logger.info(f"Generation took {duration:.2f} seconds")
            
            return response
        
        except Exception as e:
            logger.error(f"Error generating application: {e}", exc_info=True)
            
            # Create error response
            response = GenerationResponse(
                codebase_path="",
                specification={},
                request_id=request.request_id,
                target_stack=request.target_stack,
                status="error",
                error=str(e),
                metadata={
                    "error_type": type(e).__name__
                }
            )
            
            # Save error response
            response_path = request_dir / "error_response.json"
            response.save(response_path)
            
            return response
    
    def validate_specification(self, spec: AppSpecification) -> Dict[str, Any]:
        """
        Validate application specification.
        
        Args:
            spec: Application specification to validate
            
        Returns:
            Validation results
        """
        results = {
            "valid": True,
            "warnings": [],
            "errors": []
        }
        
        # Check for empty entities
        if not spec.entities:
            results["valid"] = False
            results["errors"].append("Specification has no entities")
        
        # Check for essential entity fields
        for entity in spec.entities:
            if not entity.fields:
                results["valid"] = False
                results["errors"].append(f"Entity {entity.name} has no fields")
                continue
            
            # Check for primary key
            has_primary_key = any(field.get("primary_key") for field in entity.fields)
            if not has_primary_key:
                results["warnings"].append(f"Entity {entity.name} has no explicit primary key")
        
        # Check for duplicate entity names
        entity_names = [entity.name for entity in spec.entities]
        duplicates = set([name for name in entity_names if entity_names.count(name) > 1])
        if duplicates:
            results["valid"] = False
            results["errors"].append(f"Duplicate entity names: {', '.join(duplicates)}")
        
        # Check relationships
        for rel in spec.relationships:
            # Check that entities exist
            if rel.source not in entity_names:
                results["valid"] = False
                results["errors"].append(f"Relationship source '{rel.source}' does not exist")
            
            if rel.target not in entity_names:
                results["valid"] = False
                results["errors"].append(f"Relationship target '{rel.target}' does not exist")
            
            # Check relationship type
            valid_types = ["one_to_one", "one_to_many", "many_to_one", "many_to_many"]
            if rel.type not in valid_types:
                results["valid"] = False
                results["errors"].append(f"Invalid relationship type '{rel.type}' for {rel.source} -> {rel.target}")
        
        return results
    
    def _validate_generated_code(self, codebase_path: str) -> Dict[str, Any]:
        """
        Validate generated code.
        
        Args:
            codebase_path: Path to generated codebase
            
        Returns:
            Validation results
        
        Note: In a real implementation, this would use tools like linters
        and test runners. For this demo, we perform basic file existence checks.
        """
        # Mock implementation - in a real system, we would use tools
        # from the Caca agent for code quality analysis
        results = {
            "passed": True,
            "lint_issues": [],
            "test_results": {"passed": 0, "failed": 0},
            "security_issues": [],
            "checks": []
        }
        
        # Basic file existence checks
        codebase_dir = Path(codebase_path)
        
        # Check frontend
        frontend_dir = codebase_dir / "frontend"
        if not frontend_dir.exists():
            results["passed"] = False
            results["checks"].append({
                "name": "Frontend directory",
                "passed": False,
                "message": "Frontend directory does not exist"
            })
        else:
            results["checks"].append({
                "name": "Frontend directory",
                "passed": True
            })
        
        # Check backend
        backend_dir = codebase_dir / "backend"
        if not backend_dir.exists():
            results["passed"] = False
            results["checks"].append({
                "name": "Backend directory",
                "passed": False,
                "message": "Backend directory does not exist"
            })
        else:
            results["checks"].append({
                "name": "Backend directory",
                "passed": True
            })
        
        # Check database
        database_dir = codebase_dir / "database"
        if not database_dir.exists():
            results["passed"] = False
            results["checks"].append({
                "name": "Database directory",
                "passed": False,
                "message": "Database directory does not exist"
            })
        else:
            results["checks"].append({
                "name": "Database directory",
                "passed": True
            })
        
        # Check docker-compose.yml
        docker_compose = codebase_dir / "docker-compose.yml"
        if not docker_compose.exists():
            results["passed"] = False
            results["checks"].append({
                "name": "Docker Compose file",
                "passed": False,
                "message": "docker-compose.yml does not exist"
            })
        else:
            results["checks"].append({
                "name": "Docker Compose file",
                "passed": True
            })
        
        # Check README.md
        readme = codebase_dir / "README.md"
        if not readme.exists():
            results["passed"] = False
            results["checks"].append({
                "name": "README file",
                "passed": False,
                "message": "README.md does not exist"
            })
        else:
            results["checks"].append({
                "name": "README file",
                "passed": True
            })
        
        return results
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get usage metrics.
        
        Returns:
            Dictionary with usage metrics
        """
        avg_generation_time = sum(self.generation_times) / max(1, len(self.generation_times))
        
        return {
            "generation_count": self.generation_count,
            "total_tokens_used": self.total_tokens_used,
            "average_generation_time_seconds": avg_generation_time,
            "latest_generation_time_seconds": self.generation_times[-1] if self.generation_times else None
        }


# Function to create a default interface
def create_interface(output_dir: str = "./output") -> PulseForgeInterface:
    """
    Create a default PulseForge interface.
    
    Args:
        output_dir: Output directory for generated applications
        
    Returns:
        Configured PulseForge interface
    """
    return PulseForgeInterface(output_base_dir=output_dir)


# Function for direct app generation from prompt
def generate_from_prompt(
    prompt: str,
    target_stack: str = "react-fastapi-postgres",
    output_dir: str = "./output",
    auth_required: bool = True,
    features: List[str] = None
) -> str:
    """
    Generate application from prompt.
    
    Args:
        prompt: Natural language prompt
        target_stack: Target stack (frontend-backend-database)
        output_dir: Output directory
        auth_required: Whether to add authentication
        features: Additional features to add
        
    Returns:
        Path to generated application
    """
    interface = create_interface(output_dir=output_dir)
    
    request = GenerationRequest(
        prompt=prompt,
        target_stack=target_stack,
        auth_required=auth_required,
        output_dir=output_dir,
        features=features or []
    )
    
    response = interface.generate_from_prompt(request)
    
    if response.status == "error":
        raise Exception(f"Generation failed: {response.error}")
    
    return response.codebase_path