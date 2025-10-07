#!/usr/bin/env python3
"""
Enhanced Reflection Engine with Multi-Pass Self-Critique
Implements N-pass reflection, error tracing, and quality scoring
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid
import json
from abc import ABC, abstractmethod

from utils.structured_logger import get_logger, trace_context, PerformanceTimer
from utils.cost_guard import BudgetType, spend_budget, BudgetGuard, BudgetExceededError

logger = get_logger(__name__)


class ReflectionDepth(Enum):
    """Depth levels for reflection"""
    SHALLOW = "shallow"      # Quick surface-level check
    STANDARD = "standard"    # Standard single-pass reflection
    DEEP = "deep"           # Multi-pass deep reflection
    EXHAUSTIVE = "exhaustive"  # Exhaustive analysis with error traces


class QualityDimension(Enum):
    """Dimensions of quality to assess"""
    ACCURACY = "accuracy"
    COMPLETENESS = "completeness"
    COHERENCE = "coherence"
    RELEVANCE = "relevance"
    EFFICIENCY = "efficiency"
    CREATIVITY = "creativity"
    ROBUSTNESS = "robustness"


@dataclass
class QualityScore:
    """Multi-dimensional quality score"""
    dimension: QualityDimension
    score: float  # 0-1 scale
    confidence: float  # 0-1 scale
    evidence: List[str] = field(default_factory=list)
    issues: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)


@dataclass
class ReflectionPass:
    """Single pass of reflection"""
    pass_number: int
    timestamp: datetime = field(default_factory=datetime.now)
    focus_area: str = ""
    critique: Dict[str, Any] = field(default_factory=dict)
    quality_scores: List[QualityScore] = field(default_factory=list)
    improvements_identified: List[str] = field(default_factory=list)
    error_traces: List[Dict[str, Any]] = field(default_factory=list)
    confidence: float = 0.0
    should_continue: bool = False  # Whether another pass is needed


@dataclass
class ReflectionResult:
    """Complete reflection result with all passes"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    target_id: str = ""  # ID of what we're reflecting on
    target_type: str = ""  # Type of target (output, plan, decision, etc.)
    
    # Reflection details
    depth: ReflectionDepth = ReflectionDepth.STANDARD
    passes: List[ReflectionPass] = field(default_factory=list)
    total_passes: int = 0
    
    # Aggregate scores
    overall_quality: float = 0.0  # 0-1 scale
    quality_breakdown: Dict[QualityDimension, float] = field(default_factory=dict)
    
    # Synthesis
    key_issues: List[str] = field(default_factory=list)
    recommended_actions: List[Dict[str, Any]] = field(default_factory=list)
    rewrite_suggestion: Optional[Any] = None
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    duration_ms: float = 0.0
    cost: Dict[str, float] = field(default_factory=dict)
    error_count: int = 0
    
    def add_pass(self, reflection_pass: ReflectionPass):
        """Add a reflection pass to the result"""
        self.passes.append(reflection_pass)
        self.total_passes += 1
        
        # Update aggregate scores
        self._update_aggregate_scores()
    
    def _update_aggregate_scores(self):
        """Update aggregate quality scores from all passes"""
        if not self.passes:
            return
        
        # Collect all quality scores by dimension
        dimension_scores = {}
        for pass_result in self.passes:
            for score in pass_result.quality_scores:
                if score.dimension not in dimension_scores:
                    dimension_scores[score.dimension] = []
                dimension_scores[score.dimension].append(score.score)
        
        # Average scores by dimension
        self.quality_breakdown = {
            dim: sum(scores) / len(scores)
            for dim, scores in dimension_scores.items()
        }
        
        # Overall quality (weighted average)
        if self.quality_breakdown:
            self.overall_quality = sum(self.quality_breakdown.values()) / len(self.quality_breakdown)
        
        # Collect all issues
        self.key_issues = []
        for pass_result in self.passes:
            for score in pass_result.quality_scores:
                self.key_issues.extend(score.issues)
        
        # Deduplicate
        self.key_issues = list(set(self.key_issues))


class ReflectionStrategy(ABC):
    """Abstract base class for reflection strategies"""
    
    @abstractmethod
    async def reflect(self, target: Any, context: Dict[str, Any]) -> ReflectionPass:
        """Perform a reflection pass"""
        pass


class OutputQualityReflector(ReflectionStrategy):
    """Reflects on the quality of generated outputs"""
    
    async def reflect(self, target: Any, context: Dict[str, Any]) -> ReflectionPass:
        """Assess output quality"""
        pass_num = context.get('pass_number', 1)
        expected_quality = context.get('expected_quality', {})
        
        reflection = ReflectionPass(
            pass_number=pass_num,
            focus_area="output_quality"
        )
        
        # Assess each quality dimension
        for dimension in QualityDimension:
            score = await self._assess_dimension(target, dimension, expected_quality)
            reflection.quality_scores.append(score)
            
            # Add improvements based on low scores
            if score.score < 0.7:
                reflection.improvements_identified.extend(score.suggestions)
        
        # Determine if another pass is needed
        avg_score = sum(s.score for s in reflection.quality_scores) / len(reflection.quality_scores)
        reflection.confidence = avg_score
        reflection.should_continue = avg_score < 0.8 and pass_num < 3
        
        return reflection
    
    async def _assess_dimension(self, target: Any, dimension: QualityDimension,
                              expected: Dict[str, Any]) -> QualityScore:
        """Assess a specific quality dimension"""
        # This would use LLM or rule-based assessment
        # For now, simulate assessment
        
        score = QualityScore(
            dimension=dimension,
            score=0.75,  # Placeholder
            confidence=0.8
        )
        
        if dimension == QualityDimension.ACCURACY:
            if isinstance(target, dict) and 'error' in target:
                score.score = 0.3
                score.issues.append("Output contains errors")
                score.suggestions.append("Review error handling and retry logic")
        
        elif dimension == QualityDimension.COMPLETENESS:
            if isinstance(target, dict):
                required_fields = expected.get('required_fields', [])
                missing = [f for f in required_fields if f not in target]
                if missing:
                    score.score = 0.5
                    score.issues.append(f"Missing required fields: {missing}")
                    score.suggestions.append(f"Add missing fields: {missing}")
        
        return score


class DecisionReflector(ReflectionStrategy):
    """Reflects on decision-making quality"""
    
    async def reflect(self, target: Any, context: Dict[str, Any]) -> ReflectionPass:
        """Assess decision quality"""
        reflection = ReflectionPass(
            pass_number=context.get('pass_number', 1),
            focus_area="decision_quality"
        )
        
        # Analyze decision factors
        if isinstance(target, dict):
            alternatives = target.get('alternatives_considered', [])
            criteria = target.get('decision_criteria', [])
            
            # Check comprehensiveness
            completeness_score = QualityScore(
                dimension=QualityDimension.COMPLETENESS,
                score=min(len(alternatives) / 3, 1.0),  # Expect at least 3 alternatives
                confidence=0.9
            )
            
            if completeness_score.score < 0.7:
                completeness_score.issues.append("Limited alternatives considered")
                completeness_score.suggestions.append("Consider additional options")
            
            reflection.quality_scores.append(completeness_score)
        
        return reflection


class ErrorTracer:
    """Traces and analyzes errors in execution"""
    
    @staticmethod
    def trace_error(error: Exception, context: Dict[str, Any]) -> Dict[str, Any]:
        """Create detailed error trace"""
        import traceback
        
        trace = {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'timestamp': datetime.now().isoformat(),
            'context': context,
            'stack_trace': traceback.format_exc(),
            'potential_causes': ErrorTracer._analyze_error_causes(error),
            'suggested_fixes': ErrorTracer._suggest_fixes(error)
        }
        
        return trace
    
    @staticmethod
    def _analyze_error_causes(error: Exception) -> List[str]:
        """Analyze potential error causes"""
        causes = []
        
        error_str = str(error).lower()
        
        if 'budget' in error_str:
            causes.append("Budget constraints exceeded")
            causes.append("Insufficient resource allocation")
        
        if 'timeout' in error_str:
            causes.append("Operation took too long")
            causes.append("External service unresponsive")
        
        if 'permission' in error_str:
            causes.append("Insufficient permissions")
            causes.append("ACL restrictions")
        
        if 'connection' in error_str:
            causes.append("Network connectivity issues")
            causes.append("Service endpoint unreachable")
        
        return causes
    
    @staticmethod
    def _suggest_fixes(error: Exception) -> List[str]:
        """Suggest potential fixes for error"""
        fixes = []
        
        error_str = str(error).lower()
        
        if 'budget' in error_str:
            fixes.append("Increase budget allocation")
            fixes.append("Optimize operation to use fewer resources")
            fixes.append("Break operation into smaller chunks")
        
        if 'timeout' in error_str:
            fixes.append("Increase timeout duration")
            fixes.append("Implement retry with exponential backoff")
            fixes.append("Check service health before operation")
        
        return fixes


class EnhancedReflectionEngine:
    """
    Enhanced reflection engine with multi-pass capability and error tracing
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        
        # Reflection settings
        self.max_passes = self.config.get('max_passes', 3)
        self.min_quality_threshold = self.config.get('min_quality_threshold', 0.7)
        self.reflection_timeout = self.config.get('reflection_timeout', 300)  # seconds
        
        # Strategies
        self.strategies = {
            'output': OutputQualityReflector(),
            'decision': DecisionReflector()
        }
        
        # Cost settings
        self.pass_costs = {
            ReflectionDepth.SHALLOW: {BudgetType.TOKENS: 100},
            ReflectionDepth.STANDARD: {BudgetType.TOKENS: 300},
            ReflectionDepth.DEEP: {BudgetType.TOKENS: 1000},
            ReflectionDepth.EXHAUSTIVE: {BudgetType.TOKENS: 3000}
        }
        
        # Metrics
        self.total_reflections = 0
        self.total_passes = 0
        self.total_rewrites = 0
        
        logger.info("🪞 EnhancedReflectionEngine initialized", 
                   max_passes=self.max_passes,
                   strategies=list(self.strategies.keys()))
    
    async def reflect(self, target: Any, target_type: str = 'output',
                     depth: ReflectionDepth = ReflectionDepth.STANDARD,
                     context: Optional[Dict[str, Any]] = None) -> ReflectionResult:
        """
        Perform multi-pass reflection on a target
        """
        start_time = datetime.now()
        context = context or {}
        
        result = ReflectionResult(
            target_id=context.get('target_id', str(uuid.uuid4())),
            target_type=target_type,
            depth=depth
        )
        
        goal_id = context.get('goal_id')
        
        try:
            # Check budget for reflection
            if goal_id:
                cost = self.pass_costs.get(depth, {})
                for budget_type, amount in cost.items():
                    if not spend_budget(goal_id, budget_type, amount,
                                      f"reflection_{depth.value}", "reflection"):
                        raise BudgetExceededError(f"Insufficient {budget_type} budget for reflection")
            
            # Perform reflection passes
            strategy = self.strategies.get(target_type)
            if not strategy:
                raise ValueError(f"Unknown reflection strategy: {target_type}")
            
            for pass_num in range(1, self._get_max_passes(depth) + 1):
                # Check if we should continue
                if pass_num > 1 and result.passes and not result.passes[-1].should_continue:
                    break
                
                # Perform reflection pass
                pass_context = {**context, 'pass_number': pass_num}
                reflection_pass = await self._perform_pass(
                    target, strategy, pass_context
                )
                
                result.add_pass(reflection_pass)
                self.total_passes += 1
                
                # Log pass results
                logger.info("Reflection pass completed", 
                           pass_number=pass_num,
                           quality=reflection_pass.confidence,
                           issues_found=len(reflection_pass.improvements_identified))
            
            # Generate rewrite if quality is low
            if result.overall_quality < self.min_quality_threshold:
                result.rewrite_suggestion = await self._generate_rewrite(
                    target, result, context
                )
                self.total_rewrites += 1
            
            # Generate recommendations
            result.recommended_actions = self._synthesize_recommendations(result)
            
            self.total_reflections += 1
            
        except BudgetExceededError:
            # Handle budget exceeded specifically
            logger.warning("Reflection budget exceeded", 
                         depth=depth.value,
                         goal_id=goal_id)
            raise
            
        except Exception as e:
            # Trace any errors
            error_trace = ErrorTracer.trace_error(e, context)
            result.error_count += 1
            
            # Add error as a reflection pass
            error_pass = ReflectionPass(
                pass_number=len(result.passes) + 1,
                focus_area="error_analysis",
                error_traces=[error_trace]
            )
            result.add_pass(error_pass)
            
            logger.error("Error during reflection", 
                        error_type=type(e).__name__,
                        error_message=str(e))
        
        finally:
            result.duration_ms = (datetime.now() - start_time).total_seconds() * 1000
            result.cost = self._calculate_total_cost(result)
        
        return result
    
    async def reflect_on_trajectory(self, trajectory: List[Any],
                                  context: Optional[Dict[str, Any]] = None) -> ReflectionResult:
        """
        Reflect on a sequence of actions/decisions
        """
        # Analyze the trajectory as a whole
        result = ReflectionResult(
            target_id=f"trajectory_{uuid.uuid4().hex[:8]}",
            target_type="trajectory",
            depth=ReflectionDepth.DEEP
        )
        
        # Analyze patterns
        patterns = self._analyze_trajectory_patterns(trajectory)
        
        # Create trajectory-specific reflection
        trajectory_pass = ReflectionPass(
            pass_number=1,
            focus_area="trajectory_analysis",
            critique={
                'trajectory_length': len(trajectory),
                'patterns_found': patterns,
                'efficiency': self._assess_trajectory_efficiency(trajectory)
            }
        )
        
        # Assess trajectory quality
        for dimension in [QualityDimension.EFFICIENCY, QualityDimension.COHERENCE]:
            score = QualityScore(
                dimension=dimension,
                score=0.7,  # Placeholder
                confidence=0.8
            )
            trajectory_pass.quality_scores.append(score)
        
        result.add_pass(trajectory_pass)
        
        return result
    
    async def continuous_reflection_loop(self, target_stream: asyncio.Queue,
                                       result_callback: Callable):
        """
        Continuous reflection on a stream of targets
        """
        while True:
            try:
                # Get next target
                target_info = await target_stream.get()
                if target_info is None:  # Sentinel for shutdown
                    break
                
                # Reflect on target
                result = await self.reflect(
                    target_info['target'],
                    target_info.get('type', 'output'),
                    target_info.get('depth', ReflectionDepth.STANDARD),
                    target_info.get('context')
                )
                
                # Callback with result
                await result_callback(result)
                
            except Exception as e:
                logger.error("Error in continuous reflection", error=str(e))
    
    def _get_max_passes(self, depth: ReflectionDepth) -> int:
        """Get maximum passes for depth level"""
        depth_passes = {
            ReflectionDepth.SHALLOW: 1,
            ReflectionDepth.STANDARD: 2,
            ReflectionDepth.DEEP: 3,
            ReflectionDepth.EXHAUSTIVE: self.max_passes
        }
        return depth_passes.get(depth, 2)
    
    async def _perform_pass(self, target: Any, strategy: ReflectionStrategy,
                          context: Dict[str, Any]) -> ReflectionPass:
        """Perform a single reflection pass"""
        with PerformanceTimer(logger, f"reflection_pass_{context.get('pass_number', 1)}"):
            return await strategy.reflect(target, context)
    
    async def _generate_rewrite(self, original: Any, reflection: ReflectionResult,
                              context: Dict[str, Any]) -> Any:
        """Generate improved version based on reflection"""
        # This would use LLM to rewrite based on issues found
        # For now, return a placeholder
        return {
            'rewritten': True,
            'original': original,
            'improvements_applied': reflection.key_issues[:3]
        }
    
    def _synthesize_recommendations(self, result: ReflectionResult) -> List[Dict[str, Any]]:
        """Synthesize actionable recommendations from reflection"""
        recommendations = []
        
        # Group issues by theme
        issue_themes = {}
        for issue in result.key_issues:
            # Simple categorization (would be more sophisticated in production)
            if 'error' in issue.lower():
                theme = 'error_handling'
            elif 'missing' in issue.lower() or 'incomplete' in issue.lower():
                theme = 'completeness'
            elif 'quality' in issue.lower() or 'accuracy' in issue.lower():
                theme = 'quality'
            else:
                theme = 'general'
            
            if theme not in issue_themes:
                issue_themes[theme] = []
            issue_themes[theme].append(issue)
        
        # Create recommendations by theme
        for theme, issues in issue_themes.items():
            recommendation = {
                'theme': theme,
                'priority': 'high' if len(issues) > 2 else 'medium',
                'issues': issues[:5],  # Top 5 issues
                'action': self._get_action_for_theme(theme),
                'expected_impact': self._estimate_impact(theme, len(issues))
            }
            recommendations.append(recommendation)
        
        # Sort by priority
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        recommendations.sort(key=lambda r: priority_order.get(r['priority'], 3))
        
        return recommendations
    
    def _get_action_for_theme(self, theme: str) -> str:
        """Get recommended action for issue theme"""
        actions = {
            'error_handling': "Implement robust error handling and retry logic",
            'completeness': "Add missing components and validate completeness",
            'quality': "Enhance quality checks and validation",
            'general': "Review and refine implementation"
        }
        return actions.get(theme, "Investigate and address issues")
    
    def _estimate_impact(self, theme: str, issue_count: int) -> str:
        """Estimate impact of addressing theme"""
        if issue_count > 3:
            return "High - Significant improvement expected"
        elif issue_count > 1:
            return "Medium - Moderate improvement expected"
        else:
            return "Low - Minor improvement expected"
    
    def _analyze_trajectory_patterns(self, trajectory: List[Any]) -> Dict[str, Any]:
        """Analyze patterns in a trajectory"""
        patterns = {
            'repetitions': 0,
            'backtracking': 0,
            'progress_rate': 0.0
        }
        
        # Simple pattern detection (would be more sophisticated in production)
        seen = set()
        for i, item in enumerate(trajectory):
            item_str = str(item)
            if item_str in seen:
                patterns['repetitions'] += 1
            seen.add(item_str)
        
        return patterns
    
    def _assess_trajectory_efficiency(self, trajectory: List[Any]) -> float:
        """Assess efficiency of a trajectory"""
        if not trajectory:
            return 0.0
        
        # Simple efficiency metric (would be domain-specific in production)
        unique_steps = len(set(str(item) for item in trajectory))
        efficiency = unique_steps / len(trajectory)
        
        return min(efficiency, 1.0)
    
    def _calculate_total_cost(self, result: ReflectionResult) -> Dict[str, float]:
        """Calculate total cost of reflection"""
        base_cost = self.pass_costs.get(result.depth, {})
        
        # Scale by number of passes
        total_cost = {}
        for budget_type, amount in base_cost.items():
            total_cost[budget_type.value] = amount * (result.total_passes / 2)  # Partial cost for extra passes
        
        return total_cost


# Convenience exception
class BudgetExceededError(Exception):
    """Raised when budget is exceeded during reflection"""
    pass


# Factory function
def create_enhanced_reflection_engine(config: Optional[Dict[str, Any]] = None) -> EnhancedReflectionEngine:
    """Create and configure an enhanced reflection engine"""
    default_config = {
        'max_passes': 3,
        'min_quality_threshold': 0.7,
        'reflection_timeout': 300
    }
    
    if config:
        default_config.update(config)
    
    return EnhancedReflectionEngine(default_config)