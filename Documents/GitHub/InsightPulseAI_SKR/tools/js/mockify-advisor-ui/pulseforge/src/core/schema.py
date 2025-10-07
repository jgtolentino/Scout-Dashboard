"""
PulseForge Core Schema Definitions

This module contains the core data structures used throughout PulseForge
for representing application specifications, entities, relationships, and more.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime


@dataclass
class Entity:
    """
    Represents a database entity (table/collection) with fields and metadata.
    """
    name: str
    fields: List[Dict[str, Any]]
    description: str
    is_auth_related: bool = False
    timestamps: bool = True
    soft_delete: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return asdict(self)


@dataclass
class Relationship:
    """
    Represents a relationship between entities.
    """
    source: str
    target: str
    type: str  # one_to_one, one_to_many, many_to_one, many_to_many
    description: str
    source_field: Optional[str] = None
    target_field: Optional[str] = None
    junction_table: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return asdict(self)


@dataclass
class Feature:
    """
    Represents an application feature.
    """
    name: str
    description: str
    required: bool = False
    config: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return asdict(self)


@dataclass
class BusinessRule:
    """
    Represents a business rule in the application.
    """
    name: str
    description: str
    entities_involved: List[str]
    rule_type: str  # validation, process, calculation, security
    implementation_details: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return asdict(self)


@dataclass
class UIComponent:
    """
    Represents a UI component in the application.
    """
    name: str
    type: str  # form, table, card, chart, etc.
    entity: Optional[str] = None
    fields: List[str] = field(default_factory=list)
    config: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return asdict(self)


@dataclass
class AppSpecification:
    """
    Complete application specification with all components.
    """
    name: str
    type: str  # crm, ecommerce, blog, custom, etc.
    description: str
    entities: List[Entity]
    relationships: List[Relationship]
    features: List[Feature]
    business_rules: List[BusinessRule] = field(default_factory=list)
    ui_components: List[UIComponent] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        result = asdict(self)
        result["created_at"] = result["created_at"].isoformat()
        return result


@dataclass
class CodeTemplate:
    """
    Represents a code template for generating application components.
    """
    name: str
    type: str  # frontend, backend, database
    framework: str  # react, vue, fastapi, express, etc.
    path: str
    files: List[Dict[str, Any]]
    variables: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return asdict(self)


@dataclass
class GeneratedApp:
    """
    Represents a generated application with all its components.
    """
    id: str
    name: str
    description: str
    specification: AppSpecification
    frontend_framework: str
    backend_framework: str
    database: str
    created_at: datetime = field(default_factory=datetime.now)
    deployed_url: Optional[str] = None
    github_repo: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        result = asdict(self)
        result["created_at"] = result["created_at"].isoformat()
        result["specification"] = result["specification"].to_dict()
        return result