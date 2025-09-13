"""
Maya Agent - Schema Generator

This module generates database schemas and entity relationships
based on application specifications.
"""

import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
import json
import yaml

from core.schema import AppSpecification, Entity, Relationship
from core.llm import LLMClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SchemaGenerator:
    """
    Generate database schemas and entity relationships.
    """
    
    def __init__(
        self,
        llm_client: Optional[LLMClient] = None,
        template_path: Optional[str] = None
    ):
        """
        Initialize the schema generator.
        
        Args:
            llm_client: LLM client to use for schema generation
            template_path: Path to schema templates
        """
        self.llm_client = llm_client or LLMClient()
        self.template_path = Path(template_path) if template_path else None
        
        # Load schema templates if available
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, Any]:
        """
        Load schema templates.
        
        Returns:
            Dictionary of schema templates
        """
        templates = {}
        
        if self.template_path and self.template_path.exists():
            for file_path in self.template_path.glob("*.json"):
                try:
                    with open(file_path, "r") as f:
                        templates[file_path.stem] = json.load(f)
                except Exception as e:
                    logger.warning(f"Failed to load template {file_path}: {e}")
        
        return templates
    
    def generate_schema(
        self,
        app_spec: AppSpecification,
        output_format: str = "json",
        output_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate database schema from application specification.
        
        Args:
            app_spec: Application specification
            output_format: Format to output (json or yaml)
            output_path: Path to save the schema (if None, returns dict)
            
        Returns:
            Generated schema as dictionary
        """
        logger.info(f"Generating schema for {app_spec.name}")
        
        # Start with base schema structure
        schema = {
            "name": app_spec.name,
            "type": app_spec.type,
            "description": app_spec.description,
            "entities": [],
            "relationships": []
        }
        
        # Process entities
        for entity in app_spec.entities:
            schema["entities"].append(self._process_entity(entity))
        
        # Process relationships
        for relationship in app_spec.relationships:
            schema["relationships"].append(self._process_relationship(relationship))
        
        # Add database-specific schema if needed
        schema["database_schema"] = self._generate_database_schema(app_spec)
        
        # Save to file if output path is provided
        if output_path:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, "w") as f:
                if output_format.lower() == "json":
                    json.dump(schema, f, indent=2)
                else:
                    yaml.dump(schema, f, default_flow_style=False)
            
            logger.info(f"Schema saved to {output_path}")
        
        return schema
    
    def _process_entity(self, entity: Entity) -> Dict[str, Any]:
        """
        Process an entity.
        
        Args:
            entity: Entity to process
            
        Returns:
            Processed entity dict
        """
        processed = entity.to_dict()
        
        # Enhance with additional database-specific field information
        for field in processed["fields"]:
            # Add database-specific type information
            field_type = field.get("type", "string")
            field["db_types"] = {
                "postgres": self._get_postgres_type(field_type),
                "mysql": self._get_mysql_type(field_type),
                "mongodb": self._get_mongodb_type(field_type)
            }
        
        return processed
    
    def _process_relationship(self, relationship: Relationship) -> Dict[str, Any]:
        """
        Process a relationship.
        
        Args:
            relationship: Relationship to process
            
        Returns:
            Processed relationship dict
        """
        processed = relationship.to_dict()
        
        # Add implementation details for different database types
        processed["implementation"] = {
            "postgres": self._get_postgres_relationship(relationship),
            "mysql": self._get_mysql_relationship(relationship),
            "mongodb": self._get_mongodb_relationship(relationship)
        }
        
        return processed
    
    def _get_postgres_type(self, field_type: str) -> str:
        """
        Get PostgreSQL type for a field type.
        
        Args:
            field_type: Field type
            
        Returns:
            PostgreSQL field type
        """
        type_map = {
            "string": "VARCHAR(255)",
            "text": "TEXT",
            "integer": "INTEGER",
            "int": "INTEGER",
            "float": "FLOAT",
            "decimal": "DECIMAL(12, 2)",
            "boolean": "BOOLEAN",
            "datetime": "TIMESTAMP WITH TIME ZONE",
            "date": "DATE",
            "time": "TIME",
            "uuid": "UUID",
            "json": "JSONB"
        }
        
        return type_map.get(field_type, "VARCHAR(255)")
    
    def _get_mysql_type(self, field_type: str) -> str:
        """
        Get MySQL type for a field type.
        
        Args:
            field_type: Field type
            
        Returns:
            MySQL field type
        """
        type_map = {
            "string": "VARCHAR(255)",
            "text": "TEXT",
            "integer": "INT",
            "int": "INT",
            "float": "FLOAT",
            "decimal": "DECIMAL(12, 2)",
            "boolean": "BOOLEAN",
            "datetime": "DATETIME",
            "date": "DATE",
            "time": "TIME",
            "uuid": "VARCHAR(36)",
            "json": "JSON"
        }
        
        return type_map.get(field_type, "VARCHAR(255)")
    
    def _get_mongodb_type(self, field_type: str) -> str:
        """
        Get MongoDB type for a field type.
        
        Args:
            field_type: Field type
            
        Returns:
            MongoDB field type
        """
        type_map = {
            "string": "String",
            "text": "String",
            "integer": "Number",
            "int": "Number",
            "float": "Number",
            "decimal": "Number",
            "boolean": "Boolean",
            "datetime": "Date",
            "date": "Date",
            "time": "String",
            "uuid": "String",
            "json": "Object"
        }
        
        return type_map.get(field_type, "String")
    
    def _get_postgres_relationship(self, relationship: Relationship) -> Dict[str, Any]:
        """
        Get PostgreSQL implementation for a relationship.
        
        Args:
            relationship: Relationship
            
        Returns:
            PostgreSQL implementation details
        """
        rel_type = relationship.type
        source = relationship.source.lower()
        target = relationship.target.lower()
        
        if rel_type == "one_to_many":
            # Add foreign key to "many" side
            return {
                "type": "foreign_key",
                "table": target,
                "column": f"{source}_id",
                "references": f"{source}(id)"
            }
        elif rel_type == "many_to_one":
            # Add foreign key to "many" side
            return {
                "type": "foreign_key",
                "table": source,
                "column": f"{target}_id",
                "references": f"{target}(id)"
            }
        elif rel_type == "one_to_one":
            # Add foreign key to dependent side (conventionally the target)
            return {
                "type": "foreign_key",
                "table": target,
                "column": f"{source}_id",
                "references": f"{source}(id)",
                "unique": True
            }
        elif rel_type == "many_to_many":
            # Create junction table
            junction_table = f"{source}_{target}"
            return {
                "type": "junction_table",
                "table": junction_table,
                "columns": [
                    {
                        "name": f"{source}_id",
                        "references": f"{source}(id)"
                    },
                    {
                        "name": f"{target}_id",
                        "references": f"{target}(id)"
                    }
                ]
            }
        
        return {"type": "unknown"}
    
    def _get_mysql_relationship(self, relationship: Relationship) -> Dict[str, Any]:
        """
        Get MySQL implementation for a relationship.
        
        Args:
            relationship: Relationship
            
        Returns:
            MySQL implementation details
        """
        # Similar to PostgreSQL for basic relationships
        return self._get_postgres_relationship(relationship)
    
    def _get_mongodb_relationship(self, relationship: Relationship) -> Dict[str, Any]:
        """
        Get MongoDB implementation for a relationship.
        
        Args:
            relationship: Relationship
            
        Returns:
            MongoDB implementation details
        """
        rel_type = relationship.type
        source = relationship.source
        target = relationship.target
        
        if rel_type == "one_to_many":
            # In MongoDB, typically store array of references in the "one" side
            return {
                "type": "document_reference",
                "model": source,
                "field": f"{target.lower()}s",
                "ref": target,
                "array": True
            }
        elif rel_type == "many_to_one":
            # Store reference in the "many" side
            return {
                "type": "document_reference",
                "model": source,
                "field": target.lower(),
                "ref": target,
                "array": False
            }
        elif rel_type == "one_to_one":
            # Store reference or embed
            return {
                "type": "document_reference",
                "model": source,
                "field": target.lower(),
                "ref": target,
                "array": False
            }
        elif rel_type == "many_to_many":
            # Store arrays of references on both sides
            return {
                "type": "document_reference",
                "model": source,
                "field": f"{target.lower()}s",
                "ref": target,
                "array": True,
                "bidirectional": True
            }
        
        return {"type": "unknown"}
    
    def _generate_database_schema(self, app_spec: AppSpecification) -> Dict[str, Any]:
        """
        Generate database-specific schema.
        
        Args:
            app_spec: Application specification
            
        Returns:
            Database-specific schema
        """
        return {
            "postgres": self._generate_postgres_schema(app_spec),
            "mysql": self._generate_mysql_schema(app_spec),
            "mongodb": self._generate_mongodb_schema(app_spec)
        }
    
    def _generate_postgres_schema(self, app_spec: AppSpecification) -> Dict[str, Any]:
        """
        Generate PostgreSQL schema.
        
        Args:
            app_spec: Application specification
            
        Returns:
            PostgreSQL schema
        """
        tables = {}
        
        # Create tables for entities
        for entity in app_spec.entities:
            table_name = entity.name.lower()
            tables[table_name] = {
                "name": table_name,
                "columns": []
            }
            
            # Add columns for each field
            for field in entity.fields:
                field_name = field["name"]
                field_type = field.get("type", "string")
                
                column = {
                    "name": field_name,
                    "type": self._get_postgres_type(field_type),
                    "nullable": not field.get("required", False)
                }
                
                # Add primary key if specified
                if field.get("primary_key"):
                    column["primary_key"] = True
                
                # Add unique constraint if specified
                if field.get("unique"):
                    column["unique"] = True
                
                tables[table_name]["columns"].append(column)
        
        # Add foreign keys and junction tables for relationships
        foreign_keys = []
        junction_tables = {}
        
        for rel in app_spec.relationships:
            source = rel.source.lower()
            target = rel.target.lower()
            
            if rel.type == "one_to_many":
                # Add foreign key to "many" side
                foreign_keys.append({
                    "table": target,
                    "column": f"{source}_id",
                    "references_table": source,
                    "references_column": "id"
                })
                
                # Add column to target table if it doesn't exist
                target_table = tables.get(target)
                if target_table:
                    if not any(col["name"] == f"{source}_id" for col in target_table["columns"]):
                        target_table["columns"].append({
                            "name": f"{source}_id",
                            "type": "INTEGER",
                            "nullable": True
                        })
            
            elif rel.type == "many_to_one":
                # Add foreign key to "many" side
                foreign_keys.append({
                    "table": source,
                    "column": f"{target}_id",
                    "references_table": target,
                    "references_column": "id"
                })
                
                # Add column to source table if it doesn't exist
                source_table = tables.get(source)
                if source_table:
                    if not any(col["name"] == f"{target}_id" for col in source_table["columns"]):
                        source_table["columns"].append({
                            "name": f"{target}_id",
                            "type": "INTEGER",
                            "nullable": True
                        })
            
            elif rel.type == "one_to_one":
                # Add foreign key to dependent side
                foreign_keys.append({
                    "table": target,
                    "column": f"{source}_id",
                    "references_table": source,
                    "references_column": "id",
                    "unique": True
                })
                
                # Add column to target table if it doesn't exist
                target_table = tables.get(target)
                if target_table:
                    if not any(col["name"] == f"{source}_id" for col in target_table["columns"]):
                        target_table["columns"].append({
                            "name": f"{source}_id",
                            "type": "INTEGER",
                            "nullable": True,
                            "unique": True
                        })
            
            elif rel.type == "many_to_many":
                # Create junction table
                junction_table_name = f"{source}_{target}"
                junction_tables[junction_table_name] = {
                    "name": junction_table_name,
                    "columns": [
                        {
                            "name": f"{source}_id",
                            "type": "INTEGER",
                            "nullable": False
                        },
                        {
                            "name": f"{target}_id",
                            "type": "INTEGER",
                            "nullable": False
                        }
                    ],
                    "primary_key": [f"{source}_id", f"{target}_id"],
                    "foreign_keys": [
                        {
                            "column": f"{source}_id",
                            "references_table": source,
                            "references_column": "id"
                        },
                        {
                            "column": f"{target}_id",
                            "references_table": target,
                            "references_column": "id"
                        }
                    ]
                }
        
        return {
            "tables": tables,
            "foreign_keys": foreign_keys,
            "junction_tables": junction_tables
        }
    
    def _generate_mysql_schema(self, app_spec: AppSpecification) -> Dict[str, Any]:
        """
        Generate MySQL schema.
        
        Args:
            app_spec: Application specification
            
        Returns:
            MySQL schema
        """
        # Similar to PostgreSQL schema but with MySQL types
        # For this demo, we'll return a placeholder
        return {"tables": {}}
    
    def _generate_mongodb_schema(self, app_spec: AppSpecification) -> Dict[str, Any]:
        """
        Generate MongoDB schema.
        
        Args:
            app_spec: Application specification
            
        Returns:
            MongoDB schema
        """
        models = {}
        
        # Create models for entities
        for entity in app_spec.entities:
            model_name = entity.name
            models[model_name] = {
                "name": model_name,
                "collection": entity.name.lower(),
                "fields": []
            }
            
            # Add fields
            for field in entity.fields:
                field_name = field["name"]
                field_type = field.get("type", "string")
                
                models[model_name]["fields"].append({
                    "name": field_name,
                    "type": self._get_mongodb_type(field_type),
                    "required": field.get("required", False)
                })
        
        # Add references for relationships
        for rel in app_spec.relationships:
            source = rel.source
            target = rel.target
            
            if rel.type == "one_to_many":
                # In MongoDB, typically store array of references in the "one" side
                source_model = models.get(source)
                if source_model:
                    source_model["fields"].append({
                        "name": f"{target.lower()}s",
                        "type": "Array",
                        "ref": target,
                        "required": False
                    })
            
            elif rel.type == "many_to_one":
                # Store reference in the "many" side
                source_model = models.get(source)
                if source_model:
                    source_model["fields"].append({
                        "name": target.lower(),
                        "type": "ObjectId",
                        "ref": target,
                        "required": False
                    })
            
            elif rel.type == "one_to_one":
                # Store reference
                source_model = models.get(source)
                if source_model:
                    source_model["fields"].append({
                        "name": target.lower(),
                        "type": "ObjectId",
                        "ref": target,
                        "required": False
                    })
            
            elif rel.type == "many_to_many":
                # Store arrays of references on both sides
                source_model = models.get(source)
                target_model = models.get(target)
                
                if source_model:
                    source_model["fields"].append({
                        "name": f"{target.lower()}s",
                        "type": "Array",
                        "ref": target,
                        "required": False
                    })
                
                if target_model:
                    target_model["fields"].append({
                        "name": f"{source.lower()}s",
                        "type": "Array",
                        "ref": source,
                        "required": False
                    })
        
        return {"models": models}


# Factory function to create schema generator
def create_schema_generator(llm_client: Optional[LLMClient] = None) -> SchemaGenerator:
    """
    Create a schema generator.
    
    Args:
        llm_client: LLM client to use
        
    Returns:
        Configured schema generator
    """
    return SchemaGenerator(llm_client=llm_client)


# Generate schema from app spec
def generate_schema(
    app_spec: AppSpecification,
    output_format: str = "json",
    output_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate schema from application specification.
    
    Args:
        app_spec: Application specification
        output_format: Format to output (json or yaml)
        output_path: Path to save the schema (if None, returns dict)
        
    Returns:
        Generated schema as dictionary
    """
    generator = create_schema_generator()
    return generator.generate_schema(
        app_spec=app_spec,
        output_format=output_format,
        output_path=output_path
    )