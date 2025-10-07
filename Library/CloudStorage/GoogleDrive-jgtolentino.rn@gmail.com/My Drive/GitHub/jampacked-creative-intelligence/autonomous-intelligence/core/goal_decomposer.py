#!/usr/bin/env python3
"""
Dynamic Goal Decomposition System
Implements tree/graph expansion, pruning, and reprioritization
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Set, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid
import networkx as nx
from abc import ABC, abstractmethod

from utils.structured_logger import get_logger, trace_context
from utils.cost_guard import BudgetType, spend_budget

logger = get_logger(__name__)


class NodeType(Enum):
    """Types of nodes in the goal decomposition graph"""
    GOAL = "goal"
    SUBGOAL = "subgoal"
    TASK = "task"
    ACTION = "action"
    CHECKPOINT = "checkpoint"


class NodeStatus(Enum):
    """Status of nodes in the decomposition"""
    PENDING = "pending"
    ACTIVE = "active"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    FAILED = "failed"
    PRUNED = "pruned"


@dataclass
class DecompositionNode:
    """Node in the goal decomposition graph"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    type: NodeType = NodeType.TASK
    status: NodeStatus = NodeStatus.PENDING
    description: str = ""
    parent_id: Optional[str] = None
    children_ids: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)  # IDs of nodes that must complete first
    
    # Execution details
    priority: float = 0.5  # 0-1 scale
    estimated_cost: Dict[str, float] = field(default_factory=dict)
    actual_cost: Dict[str, float] = field(default_factory=dict)
    confidence: float = 0.0
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Results
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class GoalDecomposer:
    """
    Dynamic goal decomposition system that creates and manages
    execution graphs with expansion, pruning, and reprioritization
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        
        # Graph structure
        self.graph = nx.DiGraph()
        self.nodes: Dict[str, DecompositionNode] = {}
        
        # Decomposition parameters
        self.max_depth = self.config.get('max_depth', 5)
        self.max_breadth = self.config.get('max_breadth', 10)
        self.min_confidence = self.config.get('min_confidence', 0.3)
        self.prune_threshold = self.config.get('prune_threshold', 0.2)
        
        # Strategies
        self.decomposition_strategy = self._create_decomposition_strategy()
        self.prioritization_strategy = self._create_prioritization_strategy()
        self.pruning_strategy = self._create_pruning_strategy()
        
        # Metrics
        self.total_nodes_created = 0
        self.total_nodes_pruned = 0
        self.total_decompositions = 0
        
        logger.info("🌳 GoalDecomposer initialized", 
                   max_depth=self.max_depth,
                   max_breadth=self.max_breadth)
    
    async def decompose_goal(self, goal_description: str, 
                           context: Optional[Dict[str, Any]] = None) -> DecompositionNode:
        """
        Decompose a high-level goal into an execution graph
        """
        with trace_context(component="goal_decomposer"):
            self.total_decompositions += 1
            
            # Create root goal node
            root_node = DecompositionNode(
                type=NodeType.GOAL,
                description=goal_description,
                priority=1.0,
                confidence=1.0,
                metadata=context or {}
            )
            
            self._add_node(root_node)
            
            logger.info("🎯 Decomposing goal", 
                       goal_id=root_node.id,
                       description=goal_description)
            
            # Recursively decompose
            await self._decompose_node(root_node, depth=0)
            
            # Initial prioritization
            await self.reprioritize()
            
            logger.info("✅ Goal decomposition complete", 
                       goal_id=root_node.id,
                       total_nodes=len(self.nodes),
                       graph_edges=self.graph.number_of_edges())
            
            return root_node
    
    async def expand_node(self, node_id: str) -> List[DecompositionNode]:
        """
        Dynamically expand a node by creating child nodes
        """
        node = self.nodes.get(node_id)
        if not node:
            raise ValueError(f"Node {node_id} not found")
        
        if node.status != NodeStatus.PENDING:
            logger.warning("Cannot expand non-pending node", 
                         node_id=node_id, 
                         status=node.status.value)
            return []
        
        # Check depth limit
        depth = self._get_node_depth(node_id)
        if depth >= self.max_depth:
            logger.info("Max depth reached, cannot expand", 
                       node_id=node_id,
                       depth=depth)
            return []
        
        # Generate child nodes
        children = await self.decomposition_strategy.decompose(node, self.nodes)
        
        # Add children to graph
        added_children = []
        for child in children[:self.max_breadth]:  # Limit breadth
            if child.confidence >= self.min_confidence:
                child.parent_id = node_id
                self._add_node(child)
                self.graph.add_edge(node_id, child.id)
                node.children_ids.append(child.id)
                added_children.append(child)
        
        logger.info("📊 Expanded node", 
                   node_id=node_id,
                   children_added=len(added_children),
                   children_total=len(children))
        
        return added_children
    
    async def prune_branch(self, node_id: str, reason: str = "low_priority"):
        """
        Prune a branch of the decomposition tree
        """
        node = self.nodes.get(node_id)
        if not node:
            return
        
        # Get all descendants
        descendants = nx.descendants(self.graph, node_id)
        nodes_to_prune = {node_id} | descendants
        
        # Mark all nodes as pruned
        for nid in nodes_to_prune:
            if nid in self.nodes:
                self.nodes[nid].status = NodeStatus.PRUNED
                self.nodes[nid].metadata['prune_reason'] = reason
                self.total_nodes_pruned += 1
        
        # Remove from graph
        self.graph.remove_nodes_from(nodes_to_prune)
        
        logger.info("✂️ Pruned branch", 
                   root_node_id=node_id,
                   nodes_pruned=len(nodes_to_prune),
                   reason=reason)
    
    async def reprioritize(self):
        """
        Reprioritize all nodes based on current state and progress
        """
        priorities = await self.prioritization_strategy.calculate_priorities(
            self.nodes, self.graph
        )
        
        for node_id, priority in priorities.items():
            if node_id in self.nodes:
                old_priority = self.nodes[node_id].priority
                self.nodes[node_id].priority = priority
                
                if abs(old_priority - priority) > 0.1:
                    logger.debug("Priority updated", 
                               node_id=node_id,
                               old=old_priority,
                               new=priority)
    
    async def auto_prune(self):
        """
        Automatically prune low-value branches based on strategy
        """
        nodes_to_prune = await self.pruning_strategy.identify_prune_candidates(
            self.nodes, self.graph, self.prune_threshold
        )
        
        for node_id, reason in nodes_to_prune:
            await self.prune_branch(node_id, reason)
    
    def get_executable_nodes(self) -> List[DecompositionNode]:
        """
        Get nodes that are ready for execution
        """
        executable = []
        
        for node in self.nodes.values():
            if node.status != NodeStatus.PENDING:
                continue
            
            # Check if dependencies are satisfied
            deps_satisfied = all(
                self.nodes.get(dep_id, DecompositionNode()).status == NodeStatus.COMPLETED
                for dep_id in node.dependencies
            )
            
            # Check if parent allows execution (for ordered execution)
            parent_allows = True
            if node.parent_id:
                parent = self.nodes.get(node.parent_id)
                if parent and parent.metadata.get('sequential_children'):
                    # For sequential execution, check if previous siblings completed
                    parent_allows = self._previous_siblings_completed(node)
            
            if deps_satisfied and parent_allows:
                executable.append(node)
        
        # Sort by priority
        executable.sort(key=lambda n: n.priority, reverse=True)
        
        return executable
    
    def mark_completed(self, node_id: str, result: Dict[str, Any]):
        """Mark a node as completed with its result"""
        node = self.nodes.get(node_id)
        if node:
            node.status = NodeStatus.COMPLETED
            node.completed_at = datetime.now()
            node.result = result
            
            logger.info("✅ Node completed", 
                       node_id=node_id,
                       type=node.type.value,
                       duration=(node.completed_at - node.started_at).total_seconds() if node.started_at else 0)
    
    def mark_failed(self, node_id: str, error: str):
        """Mark a node as failed"""
        node = self.nodes.get(node_id)
        if node:
            node.status = NodeStatus.FAILED
            node.completed_at = datetime.now()
            node.error = error
            
            logger.warning("❌ Node failed", 
                         node_id=node_id,
                         type=node.type.value,
                         error=error)
    
    def get_goal_progress(self, goal_id: str) -> Dict[str, Any]:
        """Get progress metrics for a goal"""
        if goal_id not in self.nodes:
            return {}
        
        descendants = nx.descendants(self.graph, goal_id) | {goal_id}
        total_nodes = len(descendants)
        
        status_counts = {status: 0 for status in NodeStatus}
        total_estimated_cost = {BudgetType.TOKENS: 0, BudgetType.USD: 0}
        total_actual_cost = {BudgetType.TOKENS: 0, BudgetType.USD: 0}
        
        for node_id in descendants:
            node = self.nodes.get(node_id)
            if node:
                status_counts[node.status] += 1
                
                for budget_type in [BudgetType.TOKENS, BudgetType.USD]:
                    total_estimated_cost[budget_type] += node.estimated_cost.get(budget_type.value, 0)
                    total_actual_cost[budget_type] += node.actual_cost.get(budget_type.value, 0)
        
        completion_rate = status_counts[NodeStatus.COMPLETED] / total_nodes if total_nodes > 0 else 0
        failure_rate = status_counts[NodeStatus.FAILED] / total_nodes if total_nodes > 0 else 0
        
        return {
            'goal_id': goal_id,
            'total_nodes': total_nodes,
            'status_breakdown': {s.value: c for s, c in status_counts.items()},
            'completion_rate': completion_rate,
            'failure_rate': failure_rate,
            'estimated_cost': total_estimated_cost,
            'actual_cost': total_actual_cost,
            'cost_variance': {
                k: total_actual_cost.get(k, 0) - total_estimated_cost.get(k, 0)
                for k in total_estimated_cost
            }
        }
    
    def visualize_graph(self) -> str:
        """Generate a text representation of the decomposition graph"""
        lines = ["Goal Decomposition Graph:"]
        lines.append("=" * 50)
        
        # Find root nodes
        roots = [n for n in self.nodes.values() if n.parent_id is None]
        
        for root in roots:
            self._add_node_to_visualization(root, lines, 0, set())
        
        return "\n".join(lines)
    
    def _add_node(self, node: DecompositionNode):
        """Add a node to the graph"""
        self.nodes[node.id] = node
        self.graph.add_node(node.id)
        self.total_nodes_created += 1
    
    def _get_node_depth(self, node_id: str) -> int:
        """Get the depth of a node in the tree"""
        depth = 0
        current_id = node_id
        
        while current_id:
            node = self.nodes.get(current_id)
            if not node or not node.parent_id:
                break
            current_id = node.parent_id
            depth += 1
        
        return depth
    
    def _previous_siblings_completed(self, node: DecompositionNode) -> bool:
        """Check if all previous siblings are completed (for sequential execution)"""
        if not node.parent_id:
            return True
        
        parent = self.nodes.get(node.parent_id)
        if not parent:
            return True
        
        # Get siblings in order
        siblings = [self.nodes[sid] for sid in parent.children_ids if sid in self.nodes]
        
        # Find this node's position
        node_index = next((i for i, s in enumerate(siblings) if s.id == node.id), -1)
        if node_index <= 0:
            return True
        
        # Check if all previous siblings are completed
        return all(
            siblings[i].status == NodeStatus.COMPLETED 
            for i in range(node_index)
        )
    
    def _add_node_to_visualization(self, node: DecompositionNode, lines: List[str], 
                                  depth: int, visited: Set[str]):
        """Recursively add node to visualization"""
        if node.id in visited:
            return
        visited.add(node.id)
        
        indent = "  " * depth
        status_icon = {
            NodeStatus.PENDING: "⏳",
            NodeStatus.ACTIVE: "🔄",
            NodeStatus.COMPLETED: "✅",
            NodeStatus.FAILED: "❌",
            NodeStatus.BLOCKED: "🚫",
            NodeStatus.PRUNED: "✂️"
        }.get(node.status, "❓")
        
        lines.append(f"{indent}{status_icon} [{node.type.value}] {node.description[:50]}...")
        lines.append(f"{indent}   Priority: {node.priority:.2f}, Confidence: {node.confidence:.2f}")
        
        # Add children
        for child_id in node.children_ids:
            child = self.nodes.get(child_id)
            if child:
                self._add_node_to_visualization(child, lines, depth + 1, visited)
    
    async def _decompose_node(self, node: DecompositionNode, depth: int):
        """Recursively decompose a node"""
        if depth >= self.max_depth:
            return
        
        # Expand the node
        children = await self.expand_node(node.id)
        
        # Recursively decompose children
        for child in children:
            if child.type in [NodeType.GOAL, NodeType.SUBGOAL]:
                await self._decompose_node(child, depth + 1)
    
    def _create_decomposition_strategy(self):
        """Create the decomposition strategy"""
        return AdaptiveDecompositionStrategy(self.config.get('decomposition', {}))
    
    def _create_prioritization_strategy(self):
        """Create the prioritization strategy"""
        return ValueComplexityPrioritizer(self.config.get('prioritization', {}))
    
    def _create_pruning_strategy(self):
        """Create the pruning strategy"""
        return ProgressBasedPruner(self.config.get('pruning', {}))


class DecompositionStrategy(ABC):
    """Abstract base class for decomposition strategies"""
    
    @abstractmethod
    async def decompose(self, node: DecompositionNode, 
                       all_nodes: Dict[str, DecompositionNode]) -> List[DecompositionNode]:
        """Decompose a node into child nodes"""
        pass


class AdaptiveDecompositionStrategy(DecompositionStrategy):
    """Adaptive decomposition that learns from past decompositions"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.decomposition_patterns = self._load_patterns()
    
    async def decompose(self, node: DecompositionNode, 
                       all_nodes: Dict[str, DecompositionNode]) -> List[DecompositionNode]:
        """Decompose based on node type and learned patterns"""
        
        if node.type == NodeType.GOAL:
            return await self._decompose_goal(node)
        elif node.type == NodeType.SUBGOAL:
            return await self._decompose_subgoal(node)
        elif node.type == NodeType.TASK:
            return await self._decompose_task(node)
        else:
            return []  # Actions don't decompose further
    
    async def _decompose_goal(self, goal: DecompositionNode) -> List[DecompositionNode]:
        """Decompose a high-level goal into subgoals"""
        # This would use LLM to intelligently decompose
        # For now, create example subgoals
        subgoals = [
            DecompositionNode(
                type=NodeType.SUBGOAL,
                description=f"Analyze requirements for: {goal.description}",
                priority=0.9,
                confidence=0.85,
                estimated_cost={BudgetType.TOKENS.value: 500}
            ),
            DecompositionNode(
                type=NodeType.SUBGOAL,
                description=f"Design solution for: {goal.description}",
                priority=0.8,
                confidence=0.8,
                estimated_cost={BudgetType.TOKENS.value: 1000},
                dependencies=[]  # Will be set to depend on analysis
            ),
            DecompositionNode(
                type=NodeType.SUBGOAL,
                description=f"Implement and validate: {goal.description}",
                priority=0.7,
                confidence=0.75,
                estimated_cost={BudgetType.TOKENS.value: 2000},
                dependencies=[]  # Will be set to depend on design
            )
        ]
        
        # Set dependencies
        if len(subgoals) >= 3:
            subgoals[1].dependencies = [subgoals[0].id]
            subgoals[2].dependencies = [subgoals[1].id]
        
        return subgoals
    
    async def _decompose_subgoal(self, subgoal: DecompositionNode) -> List[DecompositionNode]:
        """Decompose a subgoal into tasks"""
        # Create concrete tasks
        tasks = []
        
        if "analyze" in subgoal.description.lower():
            tasks.extend([
                DecompositionNode(
                    type=NodeType.TASK,
                    description="Gather relevant data and context",
                    priority=0.85,
                    confidence=0.9,
                    estimated_cost={BudgetType.TOKENS.value: 200}
                ),
                DecompositionNode(
                    type=NodeType.TASK,
                    description="Identify key requirements and constraints",
                    priority=0.8,
                    confidence=0.85,
                    estimated_cost={BudgetType.TOKENS.value: 300}
                )
            ])
        
        return tasks
    
    async def _decompose_task(self, task: DecompositionNode) -> List[DecompositionNode]:
        """Decompose a task into concrete actions"""
        # Create executable actions
        return [
            DecompositionNode(
                type=NodeType.ACTION,
                description=f"Execute: {task.description}",
                priority=task.priority,
                confidence=0.9,
                estimated_cost={BudgetType.TOKENS.value: 100},
                metadata={'tool': 'analyzer', 'params': {}}
            )
        ]
    
    def _load_patterns(self) -> Dict[str, Any]:
        """Load decomposition patterns from memory"""
        # This would load learned patterns
        return {}


class ValueComplexityPrioritizer:
    """Prioritize nodes based on value and complexity"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.value_weight = config.get('value_weight', 0.6)
        self.complexity_weight = config.get('complexity_weight', 0.4)
    
    async def calculate_priorities(self, nodes: Dict[str, DecompositionNode], 
                                 graph: nx.DiGraph) -> Dict[str, float]:
        """Calculate priority scores for all nodes"""
        priorities = {}
        
        for node_id, node in nodes.items():
            if node.status in [NodeStatus.COMPLETED, NodeStatus.FAILED, NodeStatus.PRUNED]:
                priorities[node_id] = 0.0
                continue
            
            # Calculate value score (based on goal alignment)
            value_score = self._calculate_value_score(node, nodes, graph)
            
            # Calculate complexity score (inverse - simpler is higher priority)
            complexity_score = 1.0 - self._calculate_complexity_score(node, nodes, graph)
            
            # Combined priority
            priority = (self.value_weight * value_score + 
                       self.complexity_weight * complexity_score)
            
            # Boost priority for blocked nodes when dependencies complete
            if node.status == NodeStatus.BLOCKED:
                if all(nodes.get(dep, DecompositionNode()).status == NodeStatus.COMPLETED 
                      for dep in node.dependencies):
                    priority *= 1.5
            
            priorities[node_id] = min(priority, 1.0)
        
        return priorities
    
    def _calculate_value_score(self, node: DecompositionNode, 
                              nodes: Dict[str, DecompositionNode], 
                              graph: nx.DiGraph) -> float:
        """Calculate value score based on goal contribution"""
        # Find path to root goal
        path_to_goal = []
        current = node
        
        while current:
            path_to_goal.append(current)
            if current.parent_id:
                current = nodes.get(current.parent_id)
            else:
                break
        
        # Value decreases with distance from goal
        depth_discount = 0.9 ** (len(path_to_goal) - 1)
        
        # Base value from confidence and priority
        base_value = node.confidence * node.priority
        
        return base_value * depth_discount
    
    def _calculate_complexity_score(self, node: DecompositionNode,
                                   nodes: Dict[str, DecompositionNode],
                                   graph: nx.DiGraph) -> float:
        """Calculate complexity based on dependencies and subtasks"""
        # Dependency complexity
        dep_complexity = len(node.dependencies) * 0.1
        
        # Subtask complexity
        subtask_complexity = len(node.children_ids) * 0.05
        
        # Estimated cost complexity
        cost_complexity = 0.0
        if BudgetType.TOKENS.value in node.estimated_cost:
            cost_complexity = min(node.estimated_cost[BudgetType.TOKENS.value] / 10000, 1.0)
        
        return min(dep_complexity + subtask_complexity + cost_complexity, 1.0)


class ProgressBasedPruner:
    """Prune branches based on progress and value"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.failure_threshold = config.get('failure_threshold', 0.5)
        self.low_value_threshold = config.get('low_value_threshold', 0.2)
    
    async def identify_prune_candidates(self, nodes: Dict[str, DecompositionNode],
                                      graph: nx.DiGraph,
                                      threshold: float) -> List[Tuple[str, str]]:
        """Identify nodes/branches to prune"""
        candidates = []
        
        for node_id, node in nodes.items():
            if node.status == NodeStatus.PRUNED:
                continue
            
            # Check failure rate in branch
            if node.children_ids:
                failure_rate = self._calculate_branch_failure_rate(node, nodes)
                if failure_rate > self.failure_threshold:
                    candidates.append((node_id, f"high_failure_rate_{failure_rate:.2f}"))
                    continue
            
            # Check if low value and not making progress
            if node.priority < self.low_value_threshold:
                if node.status == NodeStatus.PENDING and node.created_at:
                    age = (datetime.now() - node.created_at).total_seconds() / 3600  # hours
                    if age > 24:  # Stuck for 24 hours
                        candidates.append((node_id, "low_value_stale"))
        
        return candidates
    
    def _calculate_branch_failure_rate(self, node: DecompositionNode,
                                     nodes: Dict[str, DecompositionNode]) -> float:
        """Calculate failure rate for a branch"""
        total = 0
        failed = 0
        
        for child_id in node.children_ids:
            child = nodes.get(child_id)
            if child:
                if child.status in [NodeStatus.COMPLETED, NodeStatus.FAILED]:
                    total += 1
                    if child.status == NodeStatus.FAILED:
                        failed += 1
        
        return failed / total if total > 0 else 0.0


# Factory function
def create_goal_decomposer(config: Optional[Dict[str, Any]] = None) -> GoalDecomposer:
    """Create and configure a goal decomposer"""
    default_config = {
        'max_depth': 5,
        'max_breadth': 10,
        'min_confidence': 0.3,
        'prune_threshold': 0.2,
        'decomposition': {},
        'prioritization': {
            'value_weight': 0.6,
            'complexity_weight': 0.4
        },
        'pruning': {
            'failure_threshold': 0.5,
            'low_value_threshold': 0.2
        }
    }
    
    if config:
        default_config.update(config)
    
    return GoalDecomposer(default_config)