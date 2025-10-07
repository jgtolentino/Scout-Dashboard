"""
PulseForge Orchestrator

This module provides the orchestration layer for the PulseForge application generator,
coordinating agent interactions and workflow execution within the Pulser ecosystem.

The orchestrator handles:
1. CLI command routing and parsing
2. Agent execution sequence
3. Workflow state management
4. Integration with Claudia for memory and context
5. Telemetry and logging
6. Error handling and recovery
"""

import os
import sys
import json
import logging
import argparse
import time
from typing import Dict, List, Any, Optional, Union, Tuple
from pathlib import Path
from datetime import datetime
import uuid

# Import core PulseForge components
from agents.tide.interface import PulseForgeInterface, GenerationRequest, GenerationResponse
from agents.tide.prompt_parser import PromptParser
from agents.maya.schema_generator import SchemaGenerator
from agents.claudia.context_manager import ContextManager, create_context_manager
from agents.caca.qa_engineer import QAEngineer
from agents.kalaw.knowledge_manager import KnowledgeManager
from agents.echo.prompt_enhancer import PromptEnhancer
from agents.basher.devops_engineer import DevOpsEngineer
from agents.lovable import CloneRequest, LovableCloneManager, get_clone_manager, UXDesigner, get_ux_designer
from core.llm import LLMClient, ModelProvider
from core.system_prompts import get_agent_prompt, ACCURACY_BOOSTER

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("pulseforge.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Base paths
BASE_DIR = Path(__file__).parent.parent.parent
OUTPUT_DIR = BASE_DIR / "output"
CONFIG_DIR = BASE_DIR / "config"


class WorkflowStep:
    """Represents a single step in a workflow."""
    
    def __init__(
        self,
        agent_name: str,
        action: str,
        next_step: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize a workflow step.
        
        Args:
            agent_name: Name of the agent to execute
            action: Action to perform
            next_step: Name of the next step (or "completion" to end)
            config: Additional configuration for the step
        """
        self.agent_name = agent_name
        self.action = action
        self.next_step = next_step
        self.config = config or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "agent": self.agent_name,
            "action": self.action,
            "next": self.next_step,
            "config": self.config
        }


class Workflow:
    """Represents a workflow of agent execution steps."""
    
    def __init__(
        self,
        name: str,
        description: str,
        steps: List[WorkflowStep]
    ):
        """
        Initialize a workflow.
        
        Args:
            name: Workflow name
            description: Workflow description
            steps: List of workflow steps
        """
        self.name = name
        self.description = description
        self.steps = steps
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "name": self.name,
            "description": self.description,
            "steps": [step.to_dict() for step in self.steps]
        }


class WorkflowState:
    """Tracks the state of a workflow execution."""
    
    def __init__(
        self,
        workflow: Workflow,
        context: Dict[str, Any] = None,
        current_step_index: int = 0
    ):
        """
        Initialize workflow state.
        
        Args:
            workflow: Workflow being executed
            context: Shared context between steps
            current_step_index: Index of current step
        """
        self.workflow = workflow
        self.context = context or {}
        self.current_step_index = current_step_index
        self.step_results = []
        self.start_time = datetime.now()
        self.end_time = None
        self.errors = []
        self.warnings = []
    
    @property
    def current_step(self) -> Optional[WorkflowStep]:
        """Get the current workflow step."""
        if 0 <= self.current_step_index < len(self.workflow.steps):
            return self.workflow.steps[self.current_step_index]
        return None
    
    def advance(self) -> None:
        """Advance to the next step."""
        self.current_step_index += 1
    
    def is_complete(self) -> bool:
        """Check if workflow is complete."""
        return self.current_step_index >= len(self.workflow.steps)
    
    def add_result(self, step_name: str, result: Any) -> None:
        """
        Add a step result.
        
        Args:
            step_name: Name of the step
            result: Result of the step
        """
        self.step_results.append({
            "step": step_name,
            "result": result,
            "timestamp": datetime.now().isoformat()
        })
    
    def add_error(self, error: str) -> None:
        """
        Add an error.
        
        Args:
            error: Error message
        """
        self.errors.append({
            "message": error,
            "timestamp": datetime.now().isoformat()
        })
    
    def add_warning(self, warning: str) -> None:
        """
        Add a warning.
        
        Args:
            warning: Warning message
        """
        self.warnings.append({
            "message": warning,
            "timestamp": datetime.now().isoformat()
        })
    
    def complete(self) -> None:
        """Mark workflow as complete."""
        self.end_time = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "workflow": self.workflow.to_dict(),
            "current_step_index": self.current_step_index,
            "step_results": self.step_results,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "errors": self.errors,
            "warnings": self.warnings,
            "context": {k: v for k, v in self.context.items() if not callable(v)}
        }


class PulseForgeOrchestrator:
    """
    Main orchestrator for PulseForge application generation.
    
    This class coordinates the execution of agents and workflows
    for generating applications from prompts.
    """
    
    def __init__(
        self,
        config_path: Optional[str] = None,
        output_dir: Optional[str] = None,
        context_manager: Optional[ContextManager] = None,
        knowledge_manager: Optional[KnowledgeManager] = None,
        clone_manager: Optional[LovableCloneManager] = None,
        ux_designer: Optional[UXDesigner] = None
    ):
        """
        Initialize the orchestrator.
        
        Args:
            config_path: Path to configuration file
            output_dir: Output directory
            context_manager: Claudia context manager
            knowledge_manager: Kalaw knowledge manager
            clone_manager: Lovable clone manager
            ux_designer: Lovable UX designer
        """
        self.config = self._load_config(config_path)
        self.output_dir = Path(output_dir or OUTPUT_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize managers
        self.context_manager = context_manager or create_context_manager()
        self.knowledge_manager = knowledge_manager
        self.clone_manager = clone_manager or get_clone_manager(str(self.output_dir / "lovable_storage"))
        self.ux_designer = ux_designer or get_ux_designer()
        
        # Initialize core interface with accuracy booster
        self.interface = PulseForgeInterface(
            output_base_dir=str(self.output_dir),
            enable_validation=self.config.get("enable_validation", True),
            enable_telemetry=self.config.get("enable_telemetry", True),
            system_prompt=get_agent_prompt("tide")  # Add system prompt
        )
        
        # Initialize agent registry with system prompts
        self.agents = self._initialize_agents()
        
        # Initialize workflow registry
        self.workflows = self._initialize_workflows()
        
        # Session tracking
        self.active_workflows = {}
        self.session_id = str(uuid.uuid4())
        
        logger.info(f"PulseForge Orchestrator initialized with session ID: {self.session_id}")
    
    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Load configuration from file.
        
        Args:
            config_path: Path to configuration file
            
        Returns:
            Configuration dictionary
        """
        default_config = {
            "default_model": "gpt-4-1106-preview",
            "default_stack": "react-fastapi-postgres",
            "enable_validation": True,
            "enable_telemetry": True,
            "output_dir": str(OUTPUT_DIR),
            "log_level": "INFO"
        }
        
        if not config_path:
            config_path = CONFIG_DIR / "pulseforge_config.json"
        
        try:
            if os.path.exists(config_path):
                with open(config_path, "r") as f:
                    config = json.load(f)
                    
                # Merge with defaults
                for k, v in default_config.items():
                    if k not in config:
                        config[k] = v
                
                return config
            else:
                logger.warning(f"Config file not found at {config_path}, using defaults")
                return default_config
        except Exception as e:
            logger.error(f"Error loading config: {e}, using defaults")
            return default_config
    
    def _initialize_agents(self) -> Dict[str, Any]:
        """
        Initialize agent instances with system prompts.
        
        Returns:
            Dictionary of agent instances
        """
        # In a real implementation, these would be actual agent instances
        # For this demo, we mock them with system prompts
        
        agents = {
            "tide": {
                "interface": self.interface,
                "system_prompt": get_agent_prompt("tide"),
                "actions": {
                    "parse_prompt": lambda prompt, **kwargs: self.interface.prompt_parser.parse_prompt(prompt),
                    "generate_app": lambda spec, **kwargs: self.interface.generate_from_prompt(kwargs)
                }
            },
            "echo": {
                "system_prompt": get_agent_prompt("echo"),
                "actions": {
                    "enhance_prompt": self._echo_enhance_prompt  # Now uses system prompt
                }
            },
            "maya": {
                "system_prompt": get_agent_prompt("maya"),
                "actions": {
                    "generate_schema": lambda spec, **kwargs: spec  # Pass through for now
                }
            },
            "claudia": {
                "context_manager": self.context_manager,
                "system_prompt": get_agent_prompt("claudia"),
                "actions": {
                    "initialize_context": lambda **kwargs: {"schema": kwargs.get("schema", {})}
                }
            },
            "caca": {
                "system_prompt": get_agent_prompt("caca"),
                "actions": {
                    "perform_qa": lambda codebase, **kwargs: {"passed": True, "issues": []}
                }
            },
            "basher": {
                "system_prompt": get_agent_prompt("basher"),
                "actions": {
                    "prepare_deployment": lambda codebase, **kwargs: {"deployment_ready": True, "url": ""}
                }
            },
            "kalaw": {
                "knowledge_manager": self.knowledge_manager,
                "system_prompt": get_agent_prompt("kalaw"),
                "actions": {
                    "generate_documentation": lambda spec, **kwargs: {"docs_generated": True}
                }
            },
            "lovable": {
                "ux_designer": self.ux_designer,
                "clone_manager": self.clone_manager,
                "system_prompt": get_agent_prompt("lovable"),
                "actions": {
                    "enhance_ui_prompt": lambda prompt, **kwargs: self.ux_designer.enhance_prompt(prompt),
                    "analyze_frontend": lambda codebase_path, **kwargs: self.ux_designer.analyze_frontend_code(codebase_path),
                    "suggest_improvements": lambda app_description, tech_stack, **kwargs: self.ux_designer.suggest_ui_improvements(
                        app_description, tech_stack, kwargs.get("target_audience")
                    ),
                    "apply_design_system": lambda codebase_path, **kwargs: self.ux_designer.apply_design_system(
                        codebase_path, kwargs.get("design_system", "material")
                    ),
                    "create_clone": lambda original_id, **kwargs: self.clone_manager.create_clone_request(
                        original_id=original_id,
                        new_prompt=kwargs.get("new_prompt"),
                        new_stack=kwargs.get("new_stack"),
                        add_features=kwargs.get("add_features"),
                        remove_features=kwargs.get("remove_features"),
                        modifications=kwargs.get("modifications"),
                        output_dir=kwargs.get("output_dir"),
                        clone_name=kwargs.get("clone_name")
                    ),
                    "list_generations": lambda **kwargs: self.clone_manager.list_generations(),
                    "list_clones": lambda **kwargs: self.clone_manager.list_clones()
                }
            }
        }
        
        return agents
    
    def _echo_enhance_prompt(self, prompt: str, **kwargs) -> str:
        """
        Enhanced prompt processor using system prompt.
        
        Args:
            prompt: Original prompt
            **kwargs: Additional parameters
            
        Returns:
            Enhanced prompt
        """
        # In a real implementation, this would use an LLM with the system prompt
        # For this demo, we just append a note
        system_prompt = self.agents["echo"]["system_prompt"]
        logger.info(f"Enhancing prompt with Echo system prompt ({len(system_prompt)} chars)")
        
        # Apply prompt enhancement principles
        enhanced_prompt = f"{prompt}\n\n[Enhanced with Echo system prompt principles:\n1. Persistence\n2. Tools Calling\n3. Planning]"
        
        return enhanced_prompt
    
    def _initialize_workflows(self) -> Dict[str, Workflow]:
        """
        Initialize workflow definitions.
        
        Returns:
            Dictionary of workflow definitions
        """
        # App generation workflow
        app_generation_steps = [
            WorkflowStep("echo", "enhance_prompt", "tide"),
            WorkflowStep("tide", "parse_prompt", "maya"),
            WorkflowStep("maya", "generate_schema", "claudia"),
            WorkflowStep("claudia", "initialize_context", "tide"),
            WorkflowStep("tide", "generate_app", "caca"),
            WorkflowStep("caca", "perform_qa", "basher"),
            WorkflowStep("basher", "prepare_deployment", "kalaw"),
            WorkflowStep("kalaw", "generate_documentation", "completion")
        ]
        
        app_generation = Workflow(
            name="app_generation",
            description="End-to-end app generation from prompt to deployment",
            steps=app_generation_steps
        )
        
        # UX-enhanced app generation workflow
        ux_app_generation_steps = [
            WorkflowStep("lovable", "enhance_ui_prompt", "echo"),  # First enhance with UX principles
            WorkflowStep("echo", "enhance_prompt", "tide"),        # Then general enhancement
            WorkflowStep("tide", "parse_prompt", "maya"),
            WorkflowStep("maya", "generate_schema", "claudia"),
            WorkflowStep("claudia", "initialize_context", "tide"),
            WorkflowStep("tide", "generate_app", "lovable"),
            WorkflowStep("lovable", "analyze_frontend", "lovable"),
            WorkflowStep("lovable", "suggest_improvements", "lovable"),
            WorkflowStep("lovable", "apply_design_system", "caca"),
            WorkflowStep("caca", "perform_qa", "basher"),
            WorkflowStep("basher", "prepare_deployment", "kalaw"),
            WorkflowStep("kalaw", "generate_documentation", "completion")
        ]
        
        ux_app_generation = Workflow(
            name="ux_app_generation",
            description="UX-enhanced app generation with design system application",
            steps=ux_app_generation_steps
        )
        
        # Lovable clone workflow
        lovable_clone_steps = [
            WorkflowStep("lovable", "create_clone", "claudia"),
            WorkflowStep("claudia", "initialize_context", "tide"),
            WorkflowStep("tide", "generate_app", "lovable"),
            WorkflowStep("lovable", "apply_design_system", "caca"),
            WorkflowStep("caca", "perform_qa", "basher"),
            WorkflowStep("basher", "prepare_deployment", "kalaw"),
            WorkflowStep("kalaw", "generate_documentation", "completion")
        ]
        
        lovable_clone = Workflow(
            name="lovable_clone",
            description="Clone an existing application with modifications",
            steps=lovable_clone_steps
        )
        
        # Schema design workflow
        schema_design_steps = [
            WorkflowStep("tide", "extract_entities", "maya"),
            WorkflowStep("maya", "design_schema", "caca"),
            WorkflowStep("caca", "validate_schema", "completion")
        ]
        
        schema_design = Workflow(
            name="schema_design",
            description="Database schema design workflow",
            steps=schema_design_steps
        )
        
        # Code generation workflow
        code_generation_steps = [
            WorkflowStep("claudia", "load_schema", "tide"),
            WorkflowStep("tide", "generate_models", "tide"),
            WorkflowStep("tide", "generate_api", "tide"),
            WorkflowStep("tide", "generate_ui", "caca"),
            WorkflowStep("caca", "test_code", "completion")
        ]
        
        code_generation = Workflow(
            name="code_generation",
            description="Code generation from existing schema",
            steps=code_generation_steps
        )
        
        return {
            "app_generation": app_generation,
            "ux_app_generation": ux_app_generation,
            "lovable_clone": lovable_clone,
            "schema_design": schema_design,
            "code_generation": code_generation
        }
    
    def execute_workflow(
        self,
        workflow_name: str,
        initial_context: Dict[str, Any]
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Execute a workflow with system prompt enhanced agent behavior.
        
        Args:
            workflow_name: Name of workflow to execute
            initial_context: Initial context for workflow
            
        Returns:
            Tuple of (success, results)
        """
        if workflow_name not in self.workflows:
            raise ValueError(f"Unknown workflow: {workflow_name}")
        
        workflow = self.workflows[workflow_name]
        state = WorkflowState(workflow, initial_context)
        
        # Generate workflow ID
        workflow_id = str(uuid.uuid4())
        self.active_workflows[workflow_id] = state
        
        logger.info(f"Starting workflow '{workflow_name}' with ID {workflow_id}")
        
        # Initialize context with accuracy booster principles
        if self.context_manager:
            self.context_manager.set("accuracy_principles", {
                "persistence": "Never stop mid-task. Continue until fully solved.",
                "tools_calling": "Use available tools when uncertain.",
                "planning": "Think through approach before responding."
            })
        
        while not state.is_complete():
            step = state.current_step
            if not step:
                break
            
            logger.info(f"Executing step: {step.agent_name}.{step.action}")
            
            try:
                # Get agent
                agent = self.agents.get(step.agent_name)
                if not agent:
                    state.add_error(f"Agent not found: {step.agent_name}")
                    state.advance()
                    continue
                
                # Get action
                action = agent["actions"].get(step.action)
                if not action:
                    state.add_error(f"Action not found: {step.action}")
                    state.advance()
                    continue
                
                # Prepare context with system prompt principles
                step_context = {**state.context, **step.config}
                
                # Add agent system prompt to context for awareness
                step_context["system_prompt"] = agent.get("system_prompt", ACCURACY_BOOSTER)
                
                # Update Claudia context with step information
                if self.context_manager:
                    self.context_manager.update_agent_state(step.agent_name, {
                        "current_action": step.action,
                        "step_context": {k: v for k, v in step_context.items() 
                                         if isinstance(v, (str, int, float, bool, type(None)))}
                    })
                
                # Execute action with enhanced context
                result = action(**step_context)
                
                # Store result
                state.add_result(f"{step.agent_name}.{step.action}", result)
                
                # Update context with result
                state.context[f"{step.agent_name}_{step.action}_result"] = result
                
                # If result is a dict, add its keys to context
                if isinstance(result, dict):
                    for k, v in result.items():
                        state.context[k] = v
                
                # Update Claudia context with result
                if self.context_manager:
                    self.context_manager.update_agent_state(step.agent_name, {
                        "last_result": {
                            "action": step.action,
                            "timestamp": datetime.now().isoformat(),
                            "success": True
                        }
                    })
                
                # Advance to next step
                state.advance()
                
            except Exception as e:
                error_msg = f"Error in step {step.agent_name}.{step.action}: {str(e)}"
                logger.error(error_msg, exc_info=True)
                state.add_error(error_msg)
                
                # Update Claudia context with error
                if self.context_manager:
                    self.context_manager.update_agent_state(step.agent_name, {
                        "last_result": {
                            "action": step.action,
                            "timestamp": datetime.now().isoformat(),
                            "success": False,
                            "error": str(e)
                        }
                    })
                
                state.advance()
        
        # Mark workflow as complete
        state.complete()
        
        # Remove from active workflows
        self.active_workflows.pop(workflow_id, None)
        
        # Save workflow state
        output_path = self.output_dir / f"workflow_{workflow_id}.json"
        with open(output_path, "w") as f:
            # Filter out non-serializable objects
            state_dict = {
                k: v for k, v in state.to_dict().items()
                if k != "context" or isinstance(v, (str, int, float, list, dict, bool, type(None)))
            }
            json.dump(state_dict, f, indent=2)
        
        # Return success and context
        success = len(state.errors) == 0
        
        logger.info(f"Workflow '{workflow_name}' completed: {'success' if success else 'failure'}")
        
        return success, {
            "workflow_id": workflow_id,
            "success": success,
            "errors": state.errors,
            "warnings": state.warnings,
            "results": state.step_results,
            "output_path": str(output_path)
        }
    
    def forge_from_prompt(
        self,
        prompt: str,
        target_stack: str = None,
        features: List[str] = None,
        auth_required: bool = True,
        workflow: str = "app_generation"
    ) -> Dict[str, Any]:
        """
        Generate application from prompt.
        
        Args:
            prompt: Natural language prompt
            target_stack: Target stack (frontend-backend-database)
            features: Additional features to add
            auth_required: Whether to add authentication
            workflow: Workflow to use
            
        Returns:
            Generation results
        """
        target_stack = target_stack or self.config.get("default_stack", "react-fastapi-postgres")
        
        # If using direct interface without full workflow
        if workflow == "direct":
            request = GenerationRequest(
                prompt=prompt,
                target_stack=target_stack,
                auth_required=auth_required,
                features=features or [],
                output_dir=str(self.output_dir)
            )
            
            try:
                response = self.interface.generate_from_prompt(request)
                return {
                    "success": response.status == "success",
                    "codebase_path": response.codebase_path,
                    "error": response.error,
                    "metadata": response.metadata
                }
            except Exception as e:
                logger.error(f"Error generating from prompt: {e}", exc_info=True)
                return {
                    "success": False,
                    "error": str(e)
                }
        
        # Otherwise use workflow
        initial_context = {
            "prompt": prompt,
            "target_stack": target_stack,
            "features": features or [],
            "auth_required": auth_required,
            "request": {
                "prompt": prompt,
                "target_stack": target_stack,
                "auth_required": auth_required,
                "features": features or [],
                "output_dir": str(self.output_dir)
            }
        }
        
        success, results = self.execute_workflow(workflow, initial_context)
        return results
    
    def run(self, request: GenerationRequest) -> GenerationResponse:
        """
        Run the PulseForge generator directly (for Pulser CLI integration).
        
        Args:
            request: Generation request
            
        Returns:
            Generation response
        """
        logger.info(f"Running PulseForge generator with request: {request.prompt[:100]}...")
        
        try:
            # Initialize context for this run
            if self.context_manager:
                self.context_manager.clear()
                self.context_manager.set("request", request.to_dict())
                self.context_manager.set("accuracy_principles", {
                    "persistence": "Never stop mid-task. Continue until fully solved.",
                    "tools_calling": "Use available tools when uncertain.",
                    "planning": "Think through approach before responding."
                })
            
            # First, enhance the prompt using Echo's system prompt
            if "echo" in self.agents:
                enhanced_prompt = self._echo_enhance_prompt(request.prompt)
                request = GenerationRequest(
                    prompt=enhanced_prompt,
                    target_stack=request.target_stack,
                    auth_required=request.auth_required,
                    features=request.features,
                    output_dir=request.output_dir,
                    request_id=request.request_id,
                    model_provider=request.model_provider,
                    model_name=request.model_name,
                    metadata={**request.metadata, "prompt_enhanced": True}
                )
                
                if self.context_manager:
                    self.context_manager.set("enhanced_prompt", enhanced_prompt)
            
            # Generate with accuracy booster enhanced prompt
            response = self.interface.generate_from_prompt(request)
            
            # Log completion
            if self.context_manager:
                self.context_manager.register_artifact(
                    name=f"app_{request.request_id}",
                    artifact_type="generated_app",
                    location=response.codebase_path,
                    metadata=response.metadata
                )
            
            return response
            
        except Exception as e:
            logger.error(f"Error in run method: {e}", exc_info=True)
            return GenerationResponse(
                codebase_path="",
                specification={},
                request_id=request.request_id,
                target_stack=request.target_stack,
                status="error",
                error=str(e)
            )
    
    def cli_entry_point(self) -> int:
        """
        CLI entry point.
        
        Returns:
            Exit code (0 for success, non-zero for error)
        """
        parser = argparse.ArgumentParser(description="PulseForge Application Generator")
        subparsers = parser.add_subparsers(dest="command", help="Command to execute")
        
        # forge command
        forge_parser = subparsers.add_parser("forge", help="Generate application from prompt")
        forge_parser.add_argument("prompt", help="Natural language prompt")
        forge_parser.add_argument("--stack", help="Target stack (frontend-backend-database)")
        forge_parser.add_argument("--features", nargs="+", help="Additional features to add")
        forge_parser.add_argument("--no-auth", action="store_true", help="Disable authentication")
        forge_parser.add_argument("--workflow", default="app_generation", help="Workflow to use")
        forge_parser.add_argument("--output", help="Output directory")
        
        # schema command
        schema_parser = subparsers.add_parser("schema", help="Generate schema from prompt")
        schema_parser.add_argument("prompt", help="Natural language prompt")
        schema_parser.add_argument("--output", help="Output directory")
        
        # status command
        status_parser = subparsers.add_parser("status", help="Check status of active workflows")
        
        # Parse arguments
        args = parser.parse_args()
        
        if args.command == "forge":
            # Update output directory if specified
            if args.output:
                self.output_dir = Path(args.output)
                self.output_dir.mkdir(parents=True, exist_ok=True)
                self.interface = PulseForgeInterface(
                    output_base_dir=str(self.output_dir),
                    enable_validation=self.config.get("enable_validation", True),
                    enable_telemetry=self.config.get("enable_telemetry", True),
                    system_prompt=get_agent_prompt("tide")  # Add system prompt
                )
            
            results = self.forge_from_prompt(
                prompt=args.prompt,
                target_stack=args.stack,
                features=args.features,
                auth_required=not args.no_auth,
                workflow=args.workflow
            )
            
            if results["success"]:
                print(f"Application generated successfully!")
                if "codebase_path" in results:
                    print(f"Codebase path: {results['codebase_path']}")
                if "output_path" in results:
                    print(f"Workflow results: {results['output_path']}")
                return 0
            else:
                print(f"Error generating application: {results.get('error', 'Unknown error')}")
                return 1
        
        elif args.command == "schema":
            # Update output directory if specified
            if args.output:
                self.output_dir = Path(args.output)
                self.output_dir.mkdir(parents=True, exist_ok=True)
            
            success, results = self.execute_workflow("schema_design", {"prompt": args.prompt})
            
            if success:
                print(f"Schema generated successfully!")
                print(f"Results: {results['output_path']}")
                return 0
            else:
                print(f"Error generating schema: {results.get('errors', ['Unknown error'])}")
                return 1
        
        elif args.command == "status":
            if not self.active_workflows:
                print("No active workflows")
            else:
                print(f"Active workflows: {len(self.active_workflows)}")
                for workflow_id, state in self.active_workflows.items():
                    print(f"  {workflow_id}: {state.workflow.name} - Step {state.current_step_index + 1}/{len(state.workflow.steps)}")
            return 0
        
        else:
            parser.print_help()
            return 1


# Factory function for creating orchestrator
def create_orchestrator(config_path: Optional[str] = None, output_dir: Optional[str] = None) -> PulseForgeOrchestrator:
    """
    Create a PulseForge orchestrator.
    
    Args:
        config_path: Path to configuration file
        output_dir: Output directory
        
    Returns:
        Configured PulseForge orchestrator
    """
    return PulseForgeOrchestrator(config_path=config_path, output_dir=output_dir)


# Main entry point for CLI
def main() -> int:
    """
    Main entry point.
    
    Returns:
        Exit code
    """
    try:
        orchestrator = create_orchestrator()
        return orchestrator.cli_entry_point()
    except Exception as e:
        logger.error(f"Error in main entry point: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())