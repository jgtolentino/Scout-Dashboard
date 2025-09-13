"""
Schema validator utility for DLT quality testing.
This module provides functions to validate dataframe schemas against expected schemas.
"""
import logging
from typing import Dict, Any, List, Tuple, Optional
from pyspark.sql import DataFrame
from pyspark.sql.types import StructType, StructField, StringType, BooleanType, IntegerType, DoubleType, TimestampType, ArrayType, MapType, DataType

logger = logging.getLogger(__name__)

def get_schema_type_mapping() -> Dict[str, DataType]:
    """Return mapping of type names to PySpark types."""
    return {
        "string": StringType(),
        "boolean": BooleanType(),
        "integer": IntegerType(),
        "int": IntegerType(),
        "double": DoubleType(),
        "float": DoubleType(),
        "timestamp": TimestampType(),
        "array<string>": ArrayType(StringType()),
        "map<string,string>": MapType(StringType(), StringType())
    }

def parse_schema_from_config(schema_config: List[Dict[str, Any]]) -> StructType:
    """
    Parse a schema configuration into a PySpark StructType schema.
    
    Args:
        schema_config: List of field configurations from YAML
    
    Returns:
        StructType schema for use with PySpark
    """
    type_mapping = get_schema_type_mapping()
    fields = []
    
    for field_config in schema_config:
        field_name = field_config.get("name")
        field_type_name = field_config.get("type", "string").lower()
        nullable = field_config.get("nullable", True)
        
        if field_name is None:
            raise ValueError(f"Field configuration missing 'name': {field_config}")
        
        # Handle array types
        if field_type_name.startswith("array<"):
            inner_type_name = field_type_name[6:-1]  # Extract type inside array<type>
            inner_type = type_mapping.get(inner_type_name, StringType())
            field_type = ArrayType(inner_type, True)
        else:
            field_type = type_mapping.get(field_type_name, StringType())
        
        fields.append(StructField(field_name, field_type, nullable))
    
    return StructType(fields)

def validate_dataframe_schema(
    df: DataFrame,
    expected_schema: StructType,
    ignore_nullable: bool = False,
    ignore_extra_columns: bool = False
) -> Tuple[bool, List[str]]:
    """
    Validate that a DataFrame schema matches expected schema.
    
    Args:
        df: DataFrame to validate
        expected_schema: Expected schema as StructType
        ignore_nullable: If True, don't check nullable property
        ignore_extra_columns: If True, allow extra columns in DataFrame
    
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    actual_schema = df.schema
    
    # Get maps of field_name -> field for easier lookup
    expected_fields_map = {f.name: f for f in expected_schema.fields}
    actual_fields_map = {f.name: f for f in actual_schema.fields}
    
    # Check for missing fields
    for field_name, expected_field in expected_fields_map.items():
        if field_name not in actual_fields_map:
            errors.append(f"Missing field: {field_name}")
            continue
        
        actual_field = actual_fields_map[field_name]
        
        # Check field type
        if not isinstance(actual_field.dataType, type(expected_field.dataType)):
            errors.append(
                f"Field {field_name} has wrong type: expected {expected_field.dataType}, got {actual_field.dataType}"
            )
        
        # Check nullability if required
        if not ignore_nullable and actual_field.nullable != expected_field.nullable:
            errors.append(
                f"Field {field_name} has wrong nullability: expected {expected_field.nullable}, got {actual_field.nullable}"
            )
    
    # Check for extra fields if required
    if not ignore_extra_columns:
        extra_fields = set(actual_fields_map.keys()) - set(expected_fields_map.keys())
        if extra_fields:
            errors.append(f"Extra fields found: {', '.join(extra_fields)}")
    
    return len(errors) == 0, errors

def extract_column_expectations_from_dlt_config(dlt_config: Dict[str, Any], table_name: str) -> List[Dict[str, Any]]:
    """
    Extract column-related expectations from DLT quality checks config.
    
    Args:
        dlt_config: DLT quality checks configuration
        table_name: Name of table to extract expectations for
    
    Returns:
        List of column-related expectations
    """
    # Identify which layer this table belongs to
    for layer_key in ['bronze_expectations', 'silver_expectations', 'gold_expectations']:
        layer = dlt_config.get(layer_key, {})
        if table_name in layer:
            expectations = layer[table_name].get('expectations', [])
            return [
                exp for exp in expectations 
                if exp.get('type', '').startswith('column_')
            ]
    
    # If we can't find the table, return empty list
    return []

def generate_schema_from_expectations(dlt_config: Dict[str, Any], table_name: str) -> Optional[StructType]:
    """
    Generate a schema from DLT quality checks expectations.
    
    Args:
        dlt_config: DLT quality checks configuration
        table_name: Name of table to generate schema for
    
    Returns:
        StructType schema or None if insufficient information
    """
    # Extract column-related expectations
    column_expectations = extract_column_expectations_from_dlt_config(dlt_config, table_name)
    
    if not column_expectations:
        logger.warning(f"No column expectations found for table {table_name}")
        return None
    
    # Extract column names and determine nullability
    schema_fields = []
    columns_seen = set()
    
    for exp in column_expectations:
        column_name = exp.get('column')
        if not column_name or column_name in columns_seen:
            continue
        
        columns_seen.add(column_name)
        
        # Determine type from expectation
        exp_type = exp.get('type', '')
        field_type = "string"  # Default type
        
        if exp_type == 'column_values_between' and 'min_value' in exp and isinstance(exp['min_value'], (int, float)):
            if isinstance(exp['min_value'], int):
                field_type = "integer"
            else:
                field_type = "double"
        elif exp_type == 'column_values_greater_than' and isinstance(exp.get('value'), (int, float)):
            if isinstance(exp.get('value'), int):
                field_type = "integer"
            else:
                field_type = "double"
        elif exp_type == 'column_values_in_set' and 'value_set' in exp:
            field_type = "string"
        
        # Determine nullability based on threshold
        threshold = exp.get('threshold', 1.0)
        nullable = threshold < 1.0
        
        # Add to schema fields
        schema_fields.append({
            "name": column_name,
            "type": field_type,
            "nullable": nullable
        })
    
    if not schema_fields:
        logger.warning(f"Could not determine schema fields for table {table_name}")
        return None
    
    return parse_schema_from_config(schema_fields)