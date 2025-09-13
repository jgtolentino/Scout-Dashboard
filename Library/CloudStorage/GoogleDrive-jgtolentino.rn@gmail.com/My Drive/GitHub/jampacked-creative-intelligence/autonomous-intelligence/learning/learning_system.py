#!/usr/bin/env python3
"""
Learning System with Rewards and Performance History
Implements reward signals, cost curves, and continuous improvement
"""

import asyncio
import logging
import json
import numpy as np
from typing import Dict, List, Any, Optional, Tuple, Callable
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
import uuid
from collections import defaultdict, deque
import pickle
from abc import ABC, abstractmethod

from utils.structured_logger import get_logger, trace_context, PerformanceTimer
from utils.cost_guard import BudgetType

logger = get_logger(__name__)


class RewardType(Enum):
    """Types of rewards in the learning system"""
    GOAL_COMPLETION = "goal_completion"
    EFFICIENCY = "efficiency"
    QUALITY = "quality"
    COST_SAVING = "cost_saving"
    LEARNING = "learning"
    USER_SATISFACTION = "user_satisfaction"
    REVENUE = "revenue"
    ROAS = "roas"  # Return on Ad Spend


class MetricType(Enum):
    """Types of metrics to track"""
    SUCCESS_RATE = "success_rate"
    COMPLETION_TIME = "completion_time"
    TOKEN_USAGE = "token_usage"
    COST_USD = "cost_usd"
    ERROR_RATE = "error_rate"
    RETRY_COUNT = "retry_count"
    QUALITY_SCORE = "quality_score"
    USER_RATING = "user_rating"


@dataclass
class PerformanceRecord:
    """Record of a single performance measurement"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=datetime.now)
    
    # Context
    action_type: str = ""
    goal_id: Optional[str] = None
    plan_id: Optional[str] = None
    trace_id: Optional[str] = None
    
    # Performance metrics
    metrics: Dict[MetricType, float] = field(default_factory=dict)
    
    # Outcome
    success: bool = False
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    
    # Cost breakdown
    cost: Dict[BudgetType, float] = field(default_factory=dict)
    
    # Context features (for learning)
    features: Dict[str, Any] = field(default_factory=dict)
    
    # Reward signals
    rewards: Dict[RewardType, float] = field(default_factory=dict)


@dataclass
class LearningCurve:
    """Tracks performance over time for a specific action/strategy"""
    name: str
    window_size: int = 100
    
    # Performance history
    performance_history: deque = field(default_factory=lambda: deque(maxlen=1000))
    cost_history: deque = field(default_factory=lambda: deque(maxlen=1000))
    reward_history: deque = field(default_factory=lambda: deque(maxlen=1000))
    
    # Aggregated stats
    total_attempts: int = 0
    total_successes: int = 0
    total_cost: Dict[BudgetType, float] = field(default_factory=dict)
    total_reward: float = 0.0
    
    # Moving averages
    success_rate_ma: float = 0.0
    cost_per_success_ma: float = 0.0
    reward_rate_ma: float = 0.0
    
    # Trend indicators
    improving: bool = False
    plateau_detected: bool = False
    degrading: bool = False
    
    def add_record(self, record: PerformanceRecord):
        """Add a performance record and update statistics"""
        self.total_attempts += 1
        if record.success:
            self.total_successes += 1
        
        # Update histories
        self.performance_history.append({
            'timestamp': record.timestamp,
            'success': record.success,
            'metrics': record.metrics
        })
        
        self.cost_history.append({
            'timestamp': record.timestamp,
            'cost': record.cost
        })
        
        total_reward = sum(record.rewards.values())
        self.reward_history.append({
            'timestamp': record.timestamp,
            'reward': total_reward,
            'breakdown': record.rewards
        })
        
        # Update totals
        for budget_type, amount in record.cost.items():
            self.total_cost[budget_type] = self.total_cost.get(budget_type, 0) + amount
        self.total_reward += total_reward
        
        # Update moving averages
        self._update_moving_averages()
        
        # Detect trends
        self._detect_trends()
    
    def _update_moving_averages(self):
        """Update moving average calculations"""
        if len(self.performance_history) >= self.window_size:
            recent = list(self.performance_history)[-self.window_size:]
            self.success_rate_ma = sum(1 for r in recent if r['success']) / self.window_size
            
            # Cost per success
            recent_costs = list(self.cost_history)[-self.window_size:]
            total_recent_cost = sum(
                sum(c['cost'].values()) for c in recent_costs
            )
            recent_successes = sum(1 for r in recent if r['success'])
            if recent_successes > 0:
                self.cost_per_success_ma = total_recent_cost / recent_successes
            
            # Reward rate
            recent_rewards = list(self.reward_history)[-self.window_size:]
            self.reward_rate_ma = sum(r['reward'] for r in recent_rewards) / self.window_size
    
    def _detect_trends(self):
        """Detect performance trends"""
        if len(self.performance_history) < self.window_size * 2:
            return
        
        # Compare recent window to previous window
        mid_point = -self.window_size
        recent = list(self.performance_history)[mid_point:]
        previous = list(self.performance_history)[mid_point*2:mid_point]
        
        recent_success_rate = sum(1 for r in recent if r['success']) / len(recent)
        previous_success_rate = sum(1 for r in previous if r['success']) / len(previous)
        
        # Detect trends
        improvement_threshold = 0.05
        if recent_success_rate > previous_success_rate + improvement_threshold:
            self.improving = True
            self.degrading = False
        elif recent_success_rate < previous_success_rate - improvement_threshold:
            self.improving = False
            self.degrading = True
        else:
            self.improving = False
            self.degrading = False
            self.plateau_detected = True


@dataclass
class Strategy:
    """Represents a learnable strategy or approach"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""
    
    # Strategy parameters (can be tuned)
    parameters: Dict[str, Any] = field(default_factory=dict)
    
    # Performance tracking
    learning_curve: LearningCurve = field(default_factory=lambda: LearningCurve("default"))
    
    # A/B test results
    variant_id: Optional[str] = None
    is_control: bool = False
    win_rate: float = 0.5
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    last_used: datetime = field(default_factory=datetime.now)
    times_used: int = 0
    active: bool = True


class RewardCalculator(ABC):
    """Abstract base class for reward calculation strategies"""
    
    @abstractmethod
    async def calculate_reward(self, record: PerformanceRecord, 
                             context: Dict[str, Any]) -> Dict[RewardType, float]:
        """Calculate rewards for a performance record"""
        pass


class StandardRewardCalculator(RewardCalculator):
    """Standard reward calculation based on success, efficiency, and quality"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.weights = config.get('weights', {
            RewardType.GOAL_COMPLETION: 1.0,
            RewardType.EFFICIENCY: 0.5,
            RewardType.QUALITY: 0.7,
            RewardType.COST_SAVING: 0.3
        })
    
    async def calculate_reward(self, record: PerformanceRecord, 
                             context: Dict[str, Any]) -> Dict[RewardType, float]:
        """Calculate multi-dimensional rewards"""
        rewards = {}
        
        # Goal completion reward
        if record.success:
            rewards[RewardType.GOAL_COMPLETION] = self.weights.get(
                RewardType.GOAL_COMPLETION, 1.0
            )
        else:
            rewards[RewardType.GOAL_COMPLETION] = -0.5  # Penalty for failure
        
        # Efficiency reward (based on time and resources)
        if MetricType.COMPLETION_TIME in record.metrics:
            expected_time = context.get('expected_time', 60)
            actual_time = record.metrics[MetricType.COMPLETION_TIME]
            efficiency = min(expected_time / actual_time, 2.0) if actual_time > 0 else 0
            rewards[RewardType.EFFICIENCY] = efficiency * self.weights.get(
                RewardType.EFFICIENCY, 0.5
            )
        
        # Quality reward
        if MetricType.QUALITY_SCORE in record.metrics:
            quality = record.metrics[MetricType.QUALITY_SCORE]
            rewards[RewardType.QUALITY] = quality * self.weights.get(
                RewardType.QUALITY, 0.7
            )
        
        # Cost saving reward
        if record.cost:
            expected_cost = context.get('expected_cost', {})
            total_expected = sum(expected_cost.values())
            total_actual = sum(record.cost.values())
            
            if total_expected > 0 and total_actual < total_expected:
                savings_ratio = (total_expected - total_actual) / total_expected
                rewards[RewardType.COST_SAVING] = savings_ratio * self.weights.get(
                    RewardType.COST_SAVING, 0.3
                )
        
        return rewards


class PerformanceOptimizer:
    """Optimizes strategies based on performance history"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.learning_rate = config.get('learning_rate', 0.1)
        self.exploration_rate = config.get('exploration_rate', 0.1)
        self.min_samples = config.get('min_samples', 10)
    
    async def optimize_strategy(self, strategy: Strategy, 
                              performance_history: List[PerformanceRecord]) -> Dict[str, Any]:
        """Optimize strategy parameters based on performance"""
        if len(performance_history) < self.min_samples:
            return strategy.parameters  # Not enough data
        
        # Group by parameter combinations
        param_performance = defaultdict(list)
        for record in performance_history:
            param_key = json.dumps(record.features.get('parameters', {}), sort_keys=True)
            param_performance[param_key].append(record)
        
        # Find best performing parameters
        best_params = None
        best_score = -float('inf')
        
        for param_key, records in param_performance.items():
            # Calculate average reward
            avg_reward = sum(
                sum(r.rewards.values()) for r in records
            ) / len(records)
            
            if avg_reward > best_score:
                best_score = avg_reward
                best_params = json.loads(param_key)
        
        # Apply learning rate to parameter updates
        if best_params:
            updated_params = {}
            for key, value in strategy.parameters.items():
                if key in best_params:
                    if isinstance(value, (int, float)):
                        # Gradual update for numeric parameters
                        updated_params[key] = (
                            value * (1 - self.learning_rate) + 
                            best_params[key] * self.learning_rate
                        )
                    else:
                        # Direct update for non-numeric
                        updated_params[key] = best_params[key]
                else:
                    updated_params[key] = value
            
            return updated_params
        
        return strategy.parameters


class LearningSystem:
    """
    Complete learning system with rewards, performance tracking, and optimization
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        
        # Components
        self.reward_calculator = StandardRewardCalculator(
            self.config.get('reward_calculator', {})
        )
        self.optimizer = PerformanceOptimizer(
            self.config.get('optimizer', {})
        )
        
        # Storage
        self.performance_records: List[PerformanceRecord] = []
        self.strategies: Dict[str, Strategy] = {}
        self.learning_curves: Dict[str, LearningCurve] = {}
        
        # A/B testing
        self.active_experiments: Dict[str, Dict[str, Any]] = {}
        
        # Configuration
        self.retention_days = self.config.get('retention_days', 30)
        self.checkpoint_interval = self.config.get('checkpoint_interval', 3600)
        
        # Background tasks
        self._checkpoint_task = None
        self._cleanup_task = None
        
        # Metrics
        self.total_records = 0
        self.total_optimizations = 0
        
        logger.info("🧠 LearningSystem initialized")
    
    async def start(self):
        """Start background tasks"""
        self._checkpoint_task = asyncio.create_task(self._checkpoint_loop())
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("Learning system background tasks started")
    
    async def stop(self):
        """Stop background tasks"""
        for task in [self._checkpoint_task, self._cleanup_task]:
            if task:
                task.cancel()
        
        await asyncio.gather(
            *[t for t in [self._checkpoint_task, self._cleanup_task] if t],
            return_exceptions=True
        )
    
    async def record_performance(self, action_type: str, 
                               metrics: Dict[MetricType, float],
                               success: bool,
                               cost: Dict[BudgetType, float],
                               context: Optional[Dict[str, Any]] = None) -> PerformanceRecord:
        """
        Record a performance measurement and calculate rewards
        """
        context = context or {}
        
        # Create performance record
        record = PerformanceRecord(
            action_type=action_type,
            metrics=metrics,
            success=success,
            cost=cost,
            features=context.get('features', {}),
            goal_id=context.get('goal_id'),
            plan_id=context.get('plan_id'),
            trace_id=context.get('trace_id')
        )
        
        # Calculate rewards
        record.rewards = await self.reward_calculator.calculate_reward(record, context)
        
        # Store record
        self.performance_records.append(record)
        self.total_records += 1
        
        # Update learning curve
        curve_key = f"{action_type}_{context.get('strategy_id', 'default')}"
        if curve_key not in self.learning_curves:
            self.learning_curves[curve_key] = LearningCurve(curve_key)
        self.learning_curves[curve_key].add_record(record)
        
        # Log performance
        logger.info("📊 Performance recorded",
                   action_type=action_type,
                   success=success,
                   total_reward=sum(record.rewards.values()),
                   metrics=metrics)
        
        return record
    
    async def get_best_strategy(self, action_type: str, 
                              context: Optional[Dict[str, Any]] = None) -> Optional[Strategy]:
        """
        Get the best performing strategy for an action type
        """
        candidates = [
            s for s in self.strategies.values()
            if s.active and action_type in s.name
        ]
        
        if not candidates:
            return None
        
        # Sort by performance
        candidates.sort(
            key=lambda s: s.learning_curve.reward_rate_ma,
            reverse=True
        )
        
        # Exploration vs exploitation
        if np.random.random() < self.optimizer.exploration_rate:
            # Explore: pick random strategy
            return np.random.choice(candidates)
        else:
            # Exploit: pick best strategy
            return candidates[0]
    
    async def optimize_strategies(self):
        """
        Run optimization on all active strategies
        """
        logger.info("🔧 Running strategy optimization")
        
        for strategy in self.strategies.values():
            if not strategy.active:
                continue
            
            # Get relevant performance records
            relevant_records = [
                r for r in self.performance_records
                if r.features.get('strategy_id') == strategy.id
            ]
            
            if len(relevant_records) >= self.optimizer.min_samples:
                # Optimize parameters
                new_params = await self.optimizer.optimize_strategy(
                    strategy, relevant_records
                )
                
                # Update if changed
                if new_params != strategy.parameters:
                    strategy.parameters = new_params
                    self.total_optimizations += 1
                    
                    logger.info("Strategy optimized",
                               strategy_id=strategy.id,
                               name=strategy.name,
                               new_params=new_params)
    
    async def start_ab_test(self, name: str, control_strategy: Strategy,
                           variant_strategy: Strategy, 
                           duration_hours: int = 24) -> str:
        """
        Start an A/B test between two strategies
        """
        test_id = str(uuid.uuid4())
        
        # Mark strategies
        control_strategy.variant_id = test_id
        control_strategy.is_control = True
        variant_strategy.variant_id = test_id
        variant_strategy.is_control = False
        
        # Create experiment
        self.active_experiments[test_id] = {
            'name': name,
            'control_id': control_strategy.id,
            'variant_id': variant_strategy.id,
            'start_time': datetime.now(),
            'end_time': datetime.now() + timedelta(hours=duration_hours),
            'results': {
                'control': {'successes': 0, 'attempts': 0},
                'variant': {'successes': 0, 'attempts': 0}
            }
        }
        
        logger.info("🧪 A/B test started",
                   test_id=test_id,
                   name=name,
                   duration_hours=duration_hours)
        
        return test_id
    
    async def update_ab_test(self, test_id: str, strategy_id: str, success: bool):
        """
        Update A/B test results
        """
        if test_id not in self.active_experiments:
            return
        
        experiment = self.active_experiments[test_id]
        
        # Determine if control or variant
        if strategy_id == experiment['control_id']:
            result_key = 'control'
        elif strategy_id == experiment['variant_id']:
            result_key = 'variant'
        else:
            return
        
        # Update results
        experiment['results'][result_key]['attempts'] += 1
        if success:
            experiment['results'][result_key]['successes'] += 1
        
        # Check if test should end
        if datetime.now() > experiment['end_time']:
            await self._conclude_ab_test(test_id)
    
    async def _conclude_ab_test(self, test_id: str):
        """
        Conclude an A/B test and determine winner
        """
        experiment = self.active_experiments[test_id]
        control_results = experiment['results']['control']
        variant_results = experiment['results']['variant']
        
        # Calculate success rates
        control_rate = (
            control_results['successes'] / control_results['attempts']
            if control_results['attempts'] > 0 else 0
        )
        variant_rate = (
            variant_results['successes'] / variant_results['attempts']
            if variant_results['attempts'] > 0 else 0
        )
        
        # Determine winner
        if variant_rate > control_rate:
            winner = 'variant'
            # Update win rates
            if experiment['variant_id'] in self.strategies:
                self.strategies[experiment['variant_id']].win_rate = variant_rate
        else:
            winner = 'control'
        
        logger.info("🏆 A/B test concluded",
                   test_id=test_id,
                   name=experiment['name'],
                   winner=winner,
                   control_rate=control_rate,
                   variant_rate=variant_rate)
        
        # Clean up
        del self.active_experiments[test_id]
    
    def get_performance_summary(self, action_type: Optional[str] = None,
                              time_window: Optional[timedelta] = None) -> Dict[str, Any]:
        """
        Get performance summary statistics
        """
        # Filter records
        records = self.performance_records
        if action_type:
            records = [r for r in records if r.action_type == action_type]
        if time_window:
            cutoff = datetime.now() - time_window
            records = [r for r in records if r.timestamp > cutoff]
        
        if not records:
            return {'error': 'No records found'}
        
        # Calculate statistics
        total_attempts = len(records)
        total_successes = sum(1 for r in records if r.success)
        success_rate = total_successes / total_attempts if total_attempts > 0 else 0
        
        # Cost analysis
        total_cost = defaultdict(float)
        for record in records:
            for budget_type, amount in record.cost.items():
                total_cost[budget_type] += amount
        
        # Reward analysis
        total_rewards = defaultdict(float)
        for record in records:
            for reward_type, amount in record.rewards.items():
                total_rewards[reward_type] += amount
        
        # Learning curves
        curve_summaries = {}
        for name, curve in self.learning_curves.items():
            if not action_type or action_type in name:
                curve_summaries[name] = {
                    'success_rate': curve.success_rate_ma,
                    'cost_per_success': curve.cost_per_success_ma,
                    'reward_rate': curve.reward_rate_ma,
                    'trend': 'improving' if curve.improving else 
                            'degrading' if curve.degrading else 'stable',
                    'total_attempts': curve.total_attempts
                }
        
        return {
            'total_attempts': total_attempts,
            'total_successes': total_successes,
            'success_rate': success_rate,
            'total_cost': dict(total_cost),
            'total_rewards': dict(total_rewards),
            'average_reward': sum(total_rewards.values()) / total_attempts if total_attempts > 0 else 0,
            'learning_curves': curve_summaries,
            'active_strategies': len([s for s in self.strategies.values() if s.active]),
            'active_experiments': len(self.active_experiments)
        }
    
    async def export_learning_data(self, filepath: str):
        """
        Export learning data for analysis
        """
        export_data = {
            'metadata': {
                'export_time': datetime.now().isoformat(),
                'total_records': self.total_records,
                'total_strategies': len(self.strategies),
                'config': self.config
            },
            'performance_records': [
                asdict(r) for r in self.performance_records[-10000:]  # Last 10k records
            ],
            'strategies': {
                sid: {
                    'info': asdict(s),
                    'learning_curve': {
                        'success_rate': s.learning_curve.success_rate_ma,
                        'total_attempts': s.learning_curve.total_attempts,
                        'total_cost': s.learning_curve.total_cost
                    }
                } for sid, s in self.strategies.items()
            },
            'experiments': self.active_experiments
        }
        
        with open(filepath, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)
        
        logger.info("📤 Learning data exported", filepath=filepath)
    
    async def _checkpoint_loop(self):
        """
        Periodically save learning state
        """
        while True:
            try:
                await asyncio.sleep(self.checkpoint_interval)
                await self._save_checkpoint()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in checkpoint loop", error=str(e))
    
    async def _cleanup_loop(self):
        """
        Periodically clean up old records
        """
        while True:
            try:
                await asyncio.sleep(86400)  # Daily
                await self._cleanup_old_records()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in cleanup loop", error=str(e))
    
    async def _save_checkpoint(self):
        """
        Save current learning state
        """
        checkpoint = {
            'timestamp': datetime.now(),
            'performance_records': self.performance_records[-1000:],  # Keep recent
            'strategies': self.strategies,
            'learning_curves': self.learning_curves,
            'metrics': {
                'total_records': self.total_records,
                'total_optimizations': self.total_optimizations
            }
        }
        
        # Save to file
        checkpoint_path = f"/tmp/learning_checkpoint_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
        with open(checkpoint_path, 'wb') as f:
            pickle.dump(checkpoint, f)
        
        logger.debug("Checkpoint saved", path=checkpoint_path)
    
    async def _cleanup_old_records(self):
        """
        Clean up old performance records
        """
        cutoff = datetime.now() - timedelta(days=self.retention_days)
        
        # Filter records
        original_count = len(self.performance_records)
        self.performance_records = [
            r for r in self.performance_records
            if r.timestamp > cutoff
        ]
        
        removed = original_count - len(self.performance_records)
        if removed > 0:
            logger.info("🧹 Cleaned up old records", removed=removed)


# Factory function
def create_learning_system(config: Optional[Dict[str, Any]] = None) -> LearningSystem:
    """Create and configure a learning system"""
    default_config = {
        'retention_days': 30,
        'checkpoint_interval': 3600,
        'reward_calculator': {
            'weights': {
                RewardType.GOAL_COMPLETION: 1.0,
                RewardType.EFFICIENCY: 0.5,
                RewardType.QUALITY: 0.7,
                RewardType.COST_SAVING: 0.3
            }
        },
        'optimizer': {
            'learning_rate': 0.1,
            'exploration_rate': 0.1,
            'min_samples': 10
        }
    }
    
    if config:
        default_config.update(config)
    
    return LearningSystem(default_config)