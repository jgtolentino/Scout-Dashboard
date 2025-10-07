"""
LearnBot - Adult Learning Instructional Designer AI
Production-grade agent with evidence-based instructional design
"""

from .main import (
    LearnBot,
    AdaptiveLearningEngine,
    ContextualQAEngine,
    WalkthroughBuilder,
    LearnerProfile,
    LearningObjective,
    XAPIStatement,
    LearningStage,
    CompetenceLevel
)

__version__ = "4.1.0"
__author__ = "TBWA Learning & Development"
__description__ = "AI-powered instructional designer implementing Knowles, Merrill, and Clark frameworks"

__all__ = [
    "LearnBot",
    "AdaptiveLearningEngine",
    "ContextualQAEngine", 
    "WalkthroughBuilder",
    "LearnerProfile",
    "LearningObjective",
    "XAPIStatement",
    "LearningStage",
    "CompetenceLevel"
]