#!/usr/bin/env python3
"""
True Autonomous Loop Implementation
Implements Plan → Act → Observe → Reflect cycle without human prompts
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid
from abc import ABC, abstractmethod

from utils.structured_logger import get_logger, trace_context, PerformanceTimer
from utils.cost_guard import BudgetType, BudgetGuard, spend_budget
from utils.semaphore import SemaphoreGuard

logger = get_logger(__name__)


class LoopPhase(Enum):
    """Phases of the autonomous loop"""
    PLANNING = "planning"
    ACTING = "acting"
    OBSERVING = "observing"
    REFLECTING = "reflecting"
    IDLE = "idle"


@dataclass
class AutonomousGoal:
    """High-level goal that drives autonomous behavior"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    description: str = ""
    success_criteria: Dict[str, Any] = field(default_factory=dict)
    constraints: Dict[str, Any] = field(default_factory=dict)
    priority: int = 5  # 1-10 scale
    deadline: Optional[datetime] = None
    status: str = "active"  # active, completed, failed, archived
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ActionPlan:
    """Decomposed action plan from a goal"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    goal_id: str = ""
    actions: List[Dict[str, Any]] = field(default_factory=list)
    dependencies: Dict[str, List[str]] = field(default_factory=dict)  # action_id -> [dependency_ids]
    estimated_cost: Dict[str, float] = field(default_factory=dict)
    confidence: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Observation:
    """Result of executing an action"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    action_id: str = ""
    plan_id: str = ""
    outcome: Dict[str, Any] = field(default_factory=dict)
    success: bool = False
    error: Optional[str] = None
    side_effects: List[Dict[str, Any]] = field(default_factory=list)
    cost_actual: Dict[str, float] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class Reflection:
    """Self-critique and learning from observations"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    plan_id: str = ""
    observations: List[Observation] = field(default_factory=list)
    critique: Dict[str, Any] = field(default_factory=dict)
    improvements: List[str] = field(default_factory=list)
    next_actions: List[Dict[str, Any]] = field(default_factory=list)
    should_retry: bool = False
    should_escalate: bool = False
    learning_points: List[Dict[str, Any]] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)


class AutonomousLoop:
    """
    Core autonomous loop implementing Plan → Act → Observe → Reflect
    This is what makes the system truly agentic
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.current_phase = LoopPhase.IDLE
        self.active_goals: Dict[str, AutonomousGoal] = {}
        self.completed_goals: List[AutonomousGoal] = []
        self.current_plan: Optional[ActionPlan] = None
        self.observations: List[Observation] = []
        self.reflections: List[Reflection] = []
        
        # Loop control
        self._running = False
        self._loop_task = None
        self._consecutive_idle_cycles = 0
        self._base_interval = self.config.get('base_interval', 30)
        self._max_interval = self.config.get('max_interval', 300)
        
        # Components
        self.planner = self._create_planner()
        self.executor = self._create_executor()
        self.observer = self._create_observer()
        self.reflector = self._create_reflector()
        
        # Metrics
        self.loop_iterations = 0
        self.successful_actions = 0
        self.failed_actions = 0
        
        logger.info("🔄 AutonomousLoop initialized", 
                   base_interval=self._base_interval,
                   max_interval=self._max_interval)
    
    async def start(self, initial_goals: Optional[List[AutonomousGoal]] = None):
        """Start the autonomous loop"""
        with trace_context(component="autonomous_loop"):
            logger.info("🚀 Starting autonomous loop")
            
            if initial_goals:
                for goal in initial_goals:
                    self.active_goals[goal.id] = goal
            
            self._running = True
            self._loop_task = asyncio.create_task(self._main_loop())
            
            await self._loop_task
    
    async def stop(self):
        """Stop the autonomous loop gracefully"""
        logger.info("🛑 Stopping autonomous loop")
        self._running = False
        
        if self._loop_task:
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass
    
    async def add_goal(self, goal: AutonomousGoal):
        """Add a new goal to pursue autonomously"""
        self.active_goals[goal.id] = goal
        self._consecutive_idle_cycles = 0  # Wake up immediately
        logger.info("🎯 New goal added", goal_id=goal.id, description=goal.description)
    
    async def _main_loop(self):
        """Main autonomous execution loop"""
        while self._running:
            try:
                self.loop_iterations += 1
                
                with trace_context(component="autonomous_loop", 
                                 iteration=self.loop_iterations):
                    
                    # Check if we have active goals
                    if not self.active_goals:
                        await self._handle_idle_state()
                    else:
                        # Execute the Plan → Act → Observe → Reflect cycle
                        await self._execute_cycle()
                    
                    # Calculate next interval with exponential backoff
                    interval = self._calculate_interval()
                    
                    logger.debug("Loop iteration completed", 
                               iteration=self.loop_iterations,
                               phase=self.current_phase.value,
                               active_goals=len(self.active_goals),
                               next_interval=interval)
                    
                    await asyncio.sleep(interval)
                    
            except Exception as e:
                logger.error("Error in autonomous loop", 
                           error=str(e),
                           iteration=self.loop_iterations)
                await asyncio.sleep(self._base_interval)
    
    async def _execute_cycle(self):
        """Execute one complete Plan → Act → Observe → Reflect cycle"""
        
        # 1. PLAN: Create or update action plan
        self.current_phase = LoopPhase.PLANNING
        plan = await self._plan_phase()
        
        if not plan or not plan.actions:
            logger.info("No actions to execute in current plan")
            return
        
        # 2. ACT: Execute actions from the plan
        self.current_phase = LoopPhase.ACTING
        action_results = await self._act_phase(plan)
        
        # 3. OBSERVE: Collect and analyze results
        self.current_phase = LoopPhase.OBSERVING
        observations = await self._observe_phase(plan, action_results)
        
        # 4. REFLECT: Self-critique and determine next steps
        self.current_phase = LoopPhase.REFLECTING
        reflection = await self._reflect_phase(plan, observations)
        
        # Update goals based on reflection
        await self._update_goals_from_reflection(reflection)
    
    async def _plan_phase(self) -> Optional[ActionPlan]:
        """Planning phase: decompose goals into actionable plans"""
        with PerformanceTimer(logger, "plan_phase"):
            # Select highest priority goal
            goal = self._select_next_goal()
            if not goal:
                return None
            
            logger.info("📋 Planning for goal", goal_id=goal.id, description=goal.description)
            
            # Create action plan
            plan = await self.planner.create_plan(goal, self.observations, self.reflections)
            
            if plan:
                self.current_plan = plan
                logger.info("✅ Plan created", 
                           plan_id=plan.id,
                           action_count=len(plan.actions),
                           confidence=plan.confidence)
            
            return plan
    
    async def _act_phase(self, plan: ActionPlan) -> List[Dict[str, Any]]:
        """Acting phase: execute planned actions"""
        results = []
        
        with PerformanceTimer(logger, "act_phase", plan_id=plan.id):
            for action in plan.actions:
                # Check dependencies
                if not self._dependencies_met(action, plan, results):
                    logger.info("Skipping action due to unmet dependencies", 
                               action_id=action['id'])
                    continue
                
                # Execute action with budget control
                try:
                    with BudgetGuard(plan.goal_id, f"action_{action['id']}", 
                                   action.get('budget', {})):
                        result = await self.executor.execute_action(action)
                        results.append(result)
                        
                        if result['success']:
                            self.successful_actions += 1
                        else:
                            self.failed_actions += 1
                            
                except Exception as e:
                    logger.error("Action execution failed", 
                               action_id=action['id'],
                               error=str(e))
                    results.append({
                        'action_id': action['id'],
                        'success': False,
                        'error': str(e)
                    })
                    self.failed_actions += 1
        
        return results
    
    async def _observe_phase(self, plan: ActionPlan, action_results: List[Dict[str, Any]]) -> List[Observation]:
        """Observing phase: analyze action results and side effects"""
        observations = []
        
        with PerformanceTimer(logger, "observe_phase", plan_id=plan.id):
            for result in action_results:
                observation = await self.observer.analyze_result(result, plan)
                observations.append(observation)
                self.observations.append(observation)
                
                logger.info("👁️ Observation recorded", 
                           observation_id=observation.id,
                           success=observation.success,
                           side_effects_count=len(observation.side_effects))
        
        return observations
    
    async def _reflect_phase(self, plan: ActionPlan, observations: List[Observation]) -> Reflection:
        """Reflecting phase: self-critique and learning"""
        with PerformanceTimer(logger, "reflect_phase", plan_id=plan.id):
            reflection = await self.reflector.reflect(plan, observations, self.active_goals)
            self.reflections.append(reflection)
            
            logger.info("🤔 Reflection completed", 
                       reflection_id=reflection.id,
                       improvements_count=len(reflection.improvements),
                       should_retry=reflection.should_retry,
                       learning_points=len(reflection.learning_points))
            
            # Store learning points for future use
            if reflection.learning_points:
                await self._store_learnings(reflection.learning_points)
            
            return reflection
    
    async def _update_goals_from_reflection(self, reflection: Reflection):
        """Update goals based on reflection insights"""
        # Check if current goal is completed
        if reflection.critique.get('goal_completed'):
            goal_id = self.current_plan.goal_id
            if goal_id in self.active_goals:
                goal = self.active_goals[goal_id]
                goal.status = 'completed'
                goal.completed_at = datetime.now()
                self.completed_goals.append(goal)
                del self.active_goals[goal_id]
                logger.info("🎉 Goal completed", goal_id=goal_id)
        
        # Add new sub-goals if needed
        for next_action in reflection.next_actions:
            if next_action.get('type') == 'new_goal':
                new_goal = AutonomousGoal(
                    description=next_action['description'],
                    success_criteria=next_action.get('success_criteria', {}),
                    priority=next_action.get('priority', 5),
                    metadata={'parent_reflection': reflection.id}
                )
                await self.add_goal(new_goal)
    
    async def _handle_idle_state(self):
        """Handle idle state when no active goals"""
        self.current_phase = LoopPhase.IDLE
        self._consecutive_idle_cycles += 1
        
        logger.debug("Idle state", 
                    consecutive_cycles=self._consecutive_idle_cycles,
                    completed_goals=len(self.completed_goals))
        
        # Periodic maintenance tasks
        if self._consecutive_idle_cycles % 10 == 0:
            await self._perform_maintenance()
    
    def _calculate_interval(self) -> float:
        """Calculate next loop interval with exponential backoff"""
        if self.current_phase == LoopPhase.IDLE:
            # Exponential backoff during idle
            interval = min(
                self._base_interval * (2 ** min(self._consecutive_idle_cycles - 1, 4)),
                self._max_interval
            )
        else:
            # Active phase - use base interval
            self._consecutive_idle_cycles = 0
            interval = self._base_interval
        
        return interval
    
    def _select_next_goal(self) -> Optional[AutonomousGoal]:
        """Select the next goal to work on based on priority and deadlines"""
        if not self.active_goals:
            return None
        
        # Sort by priority and deadline
        goals = list(self.active_goals.values())
        goals.sort(key=lambda g: (
            -g.priority,  # Higher priority first
            g.deadline or datetime.max  # Earlier deadlines first
        ))
        
        return goals[0]
    
    def _dependencies_met(self, action: Dict[str, Any], plan: ActionPlan, 
                         completed_results: List[Dict[str, Any]]) -> bool:
        """Check if action dependencies are satisfied"""
        dependencies = plan.dependencies.get(action['id'], [])
        completed_ids = {r['action_id'] for r in completed_results if r.get('success')}
        return all(dep_id in completed_ids for dep_id in dependencies)
    
    async def _store_learnings(self, learning_points: List[Dict[str, Any]]):
        """Store learning points for future reference"""
        # This would integrate with the learning memory system
        logger.info("💾 Storing learning points", count=len(learning_points))
    
    async def _perform_maintenance(self):
        """Perform periodic maintenance tasks"""
        logger.info("🧹 Performing maintenance")
        # Clean up old observations and reflections
        # Compact memory stores
        # Update metrics
    
    def _create_planner(self):
        """Create the planning component"""
        return DynamicPlanner(self.config.get('planner', {}))
    
    def _create_executor(self):
        """Create the action executor component"""
        return ToolExecutor(self.config.get('executor', {}))
    
    def _create_observer(self):
        """Create the observation component"""
        return ResultObserver(self.config.get('observer', {}))
    
    def _create_reflector(self):
        """Create the reflection component"""
        return SelfReflector(self.config.get('reflector', {}))


class DynamicPlanner:
    """Dynamic goal decomposition with tree/graph expansion"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.max_depth = config.get('max_depth', 5)
        self.max_actions_per_plan = config.get('max_actions_per_plan', 10)
    
    async def create_plan(self, goal: AutonomousGoal, 
                         observations: List[Observation],
                         reflections: List[Reflection]) -> Optional[ActionPlan]:
        """Create an action plan from a goal"""
        # This would use LLM to decompose the goal
        # For now, create a simple plan
        plan = ActionPlan(
            goal_id=goal.id,
            actions=[
                {
                    'id': str(uuid.uuid4()),
                    'type': 'analyze',
                    'description': f"Analyze requirements for: {goal.description}",
                    'tool': 'analyzer',
                    'params': {'goal': goal.description},
                    'budget': {
                        BudgetType.TOKENS: 100,
                        BudgetType.TIME_SECONDS: 30
                    }
                }
            ],
            confidence=0.8
        )
        
        return plan


class ToolExecutor:
    """Executes actions using tools with side effects"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.tools = self._initialize_tools()
    
    async def execute_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute an action using the appropriate tool"""
        tool_name = action.get('tool')
        tool = self.tools.get(tool_name)
        
        if not tool:
            return {
                'action_id': action['id'],
                'success': False,
                'error': f"Unknown tool: {tool_name}"
            }
        
        # Execute with proper error handling
        try:
            result = await tool.execute(action['params'])
            return {
                'action_id': action['id'],
                'success': True,
                'result': result,
                'tool': tool_name
            }
        except Exception as e:
            return {
                'action_id': action['id'],
                'success': False,
                'error': str(e),
                'tool': tool_name
            }
    
    def _initialize_tools(self) -> Dict[str, Any]:
        """Initialize available tools"""
        # This would load actual tool implementations
        return {
            'analyzer': MockAnalyzerTool(),
            'writer': MockWriterTool(),
            'searcher': MockSearcherTool()
        }


class ResultObserver:
    """Observes and analyzes action results"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    async def analyze_result(self, result: Dict[str, Any], plan: ActionPlan) -> Observation:
        """Analyze an action result and create an observation"""
        observation = Observation(
            action_id=result['action_id'],
            plan_id=plan.id,
            outcome=result.get('result', {}),
            success=result.get('success', False),
            error=result.get('error'),
            side_effects=self._detect_side_effects(result),
            cost_actual={
                'tokens': result.get('tokens_used', 0),
                'time_seconds': result.get('duration', 0)
            }
        )
        
        return observation
    
    def _detect_side_effects(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect any side effects from the action"""
        # This would analyze what changed in the environment
        return []


class SelfReflector:
    """Implements self-critique and reflection"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.critique_depth = config.get('critique_depth', 2)
    
    async def reflect(self, plan: ActionPlan, 
                     observations: List[Observation],
                     active_goals: Dict[str, AutonomousGoal]) -> Reflection:
        """Reflect on observations and generate insights"""
        # Analyze success rate
        success_rate = sum(1 for o in observations if o.success) / len(observations) if observations else 0
        
        # Generate critique
        critique = {
            'success_rate': success_rate,
            'goal_progress': self._assess_goal_progress(plan, observations, active_goals),
            'efficiency': self._assess_efficiency(plan, observations),
            'quality': self._assess_quality(observations)
        }
        
        # Determine next steps
        should_retry = success_rate < 0.5 and critique['goal_progress'] < 0.8
        
        # Generate improvements
        improvements = []
        if success_rate < 0.7:
            improvements.append("Improve action success rate through better planning")
        if critique['efficiency'] < 0.6:
            improvements.append("Optimize resource usage and execution time")
        
        reflection = Reflection(
            plan_id=plan.id,
            observations=observations,
            critique=critique,
            improvements=improvements,
            should_retry=should_retry,
            learning_points=self._extract_learning_points(observations)
        )
        
        return reflection
    
    def _assess_goal_progress(self, plan: ActionPlan, observations: List[Observation], 
                             active_goals: Dict[str, AutonomousGoal]) -> float:
        """Assess progress toward goal completion"""
        # This would analyze how much closer we are to the goal
        return 0.7  # Placeholder
    
    def _assess_efficiency(self, plan: ActionPlan, observations: List[Observation]) -> float:
        """Assess execution efficiency"""
        # Compare actual vs estimated costs
        return 0.8  # Placeholder
    
    def _assess_quality(self, observations: List[Observation]) -> float:
        """Assess quality of outcomes"""
        # This would use domain-specific quality metrics
        return 0.85  # Placeholder
    
    def _extract_learning_points(self, observations: List[Observation]) -> List[Dict[str, Any]]:
        """Extract learnings from observations"""
        learnings = []
        
        for obs in observations:
            if not obs.success and obs.error:
                learnings.append({
                    'type': 'error_pattern',
                    'context': obs.action_id,
                    'error': obs.error,
                    'timestamp': obs.timestamp
                })
        
        return learnings


# Mock tool implementations for testing
class MockAnalyzerTool:
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        await asyncio.sleep(0.1)  # Simulate work
        return {'analysis': 'Goal requires 3 sub-tasks', 'confidence': 0.85}


class MockWriterTool:
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        await asyncio.sleep(0.2)
        return {'content': 'Generated content based on analysis', 'word_count': 150}


class MockSearcherTool:
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        await asyncio.sleep(0.15)
        return {'results': ['Result 1', 'Result 2'], 'relevance': 0.9}


# Factory function
def create_autonomous_loop(config: Optional[Dict[str, Any]] = None) -> AutonomousLoop:
    """Create and configure an autonomous loop"""
    default_config = {
        'base_interval': 30,
        'max_interval': 300,
        'planner': {
            'max_depth': 5,
            'max_actions_per_plan': 10
        },
        'executor': {
            'max_parallel': 3
        },
        'reflector': {
            'critique_depth': 2
        }
    }
    
    if config:
        default_config.update(config)
    
    return AutonomousLoop(default_config)