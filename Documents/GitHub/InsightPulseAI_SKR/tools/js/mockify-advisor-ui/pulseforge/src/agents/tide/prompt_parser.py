"""
Tide Agent - Prompt Parser

This module parses natural language prompts into structured app specifications
that can be used by other agents in the PulseForge system.
"""

import re
import json
import yaml
from typing import Dict, List, Any, Optional, Tuple

# Import LLM client (placeholder - would be replaced with actual implementation)
from core.llm import LLMClient
from core.schema import AppSpecification, Entity, Relationship, Feature, BusinessRule

class PromptParser:
    """
    Parse natural language prompts into structured app specifications.
    """
    
    def __init__(self, llm_client: Optional[LLMClient] = None):
        """
        Initialize the prompt parser.
        
        Args:
            llm_client: LLM client to use for parsing
        """
        self.llm_client = llm_client or LLMClient()
        self.common_app_patterns = self._load_patterns()
    
    def _load_patterns(self) -> Dict[str, Any]:
        """
        Load common app patterns and entity templates.
        
        Returns:
            Dictionary of patterns and templates
        """
        # In a real implementation, this would load from a file or database
        return {
            "app_types": {
                "crm": {
                    "entities": ["Customer", "Contact", "Deal", "Task", "Note"],
                    "features": ["authentication", "dashboard", "reporting"],
                    "relationships": [
                        {"from": "Customer", "to": "Contact", "type": "one_to_many"},
                        {"from": "Customer", "to": "Deal", "type": "one_to_many"},
                        {"from": "Deal", "to": "Task", "type": "one_to_many"},
                        {"from": "Deal", "to": "Note", "type": "one_to_many"}
                    ]
                },
                "ecommerce": {
                    "entities": ["Product", "Category", "Cart", "Order", "Customer", "Review"],
                    "features": ["authentication", "payment", "search", "admin"],
                    "relationships": [
                        {"from": "Product", "to": "Category", "type": "many_to_one"},
                        {"from": "Product", "to": "Review", "type": "one_to_many"},
                        {"from": "Customer", "to": "Order", "type": "one_to_many"},
                        {"from": "Order", "to": "Product", "type": "many_to_many"}
                    ]
                },
                "blog": {
                    "entities": ["Post", "Category", "Tag", "Comment", "User"],
                    "features": ["authentication", "editor", "search", "rss"],
                    "relationships": [
                        {"from": "Post", "to": "Category", "type": "many_to_one"},
                        {"from": "Post", "to": "Tag", "type": "many_to_many"},
                        {"from": "Post", "to": "Comment", "type": "one_to_many"},
                        {"from": "Comment", "to": "User", "type": "many_to_one"}
                    ]
                }
            },
            "entity_templates": {
                "User": {
                    "fields": [
                        {"name": "id", "type": "uuid", "primary_key": True},
                        {"name": "username", "type": "string", "unique": True},
                        {"name": "email", "type": "string", "unique": True},
                        {"name": "password", "type": "string"},
                        {"name": "created_at", "type": "datetime"},
                        {"name": "updated_at", "type": "datetime"}
                    ]
                },
                "Product": {
                    "fields": [
                        {"name": "id", "type": "uuid", "primary_key": True},
                        {"name": "name", "type": "string"},
                        {"name": "description", "type": "text"},
                        {"name": "price", "type": "decimal"},
                        {"name": "stock", "type": "integer"},
                        {"name": "created_at", "type": "datetime"},
                        {"name": "updated_at", "type": "datetime"}
                    ]
                },
                "Post": {
                    "fields": [
                        {"name": "id", "type": "uuid", "primary_key": True},
                        {"name": "title", "type": "string"},
                        {"name": "content", "type": "text"},
                        {"name": "published", "type": "boolean"},
                        {"name": "published_at", "type": "datetime"},
                        {"name": "created_at", "type": "datetime"},
                        {"name": "updated_at", "type": "datetime"}
                    ]
                }
            }
        }
    
    def parse_prompt(self, prompt: str) -> AppSpecification:
        """
        Parse a natural language prompt into a structured app specification.
        
        Args:
            prompt: Natural language prompt describing the desired application
            
        Returns:
            Structured app specification
        """
        # 1. Identify app type and basic requirements
        app_type, app_name = self._identify_app_type(prompt)
        
        # 2. Extract entities and their fields
        entities = self._extract_entities(prompt, app_type)
        
        # 3. Extract relationships between entities
        relationships = self._extract_relationships(prompt, entities, app_type)
        
        # 4. Extract features and business rules
        features = self._extract_features(prompt, app_type)
        business_rules = self._extract_business_rules(prompt, entities, relationships)
        
        # 5. Create and return the app specification
        return AppSpecification(
            name=app_name,
            type=app_type,
            description=self._generate_description(prompt, app_type),
            entities=entities,
            relationships=relationships,
            features=features,
            business_rules=business_rules
        )
    
    def _identify_app_type(self, prompt: str) -> Tuple[str, str]:
        """
        Identify the type of application from the prompt.
        
        Args:
            prompt: Natural language prompt
            
        Returns:
            Tuple of (app_type, app_name)
        """
        # In a real implementation, this would use the LLM to identify the app type
        # Here, we use a simplified approach with keyword matching
        
        app_types = {
            "crm": ["crm", "customer relationship", "sales", "lead", "deal", "pipeline"],
            "ecommerce": ["ecommerce", "e-commerce", "shop", "store", "product", "cart", "checkout"],
            "blog": ["blog", "content", "post", "article", "cms", "content management"]
        }
        
        # Default app name - will be refined with LLM in real implementation
        app_name = "My App"
        
        # Check for explicit app name in prompt
        name_match = re.search(r"called\s+['\"](.*?)['\"]", prompt) or re.search(r"named\s+['\"](.*?)['\"]", prompt)
        if name_match:
            app_name = name_match.group(1)
        
        # Detect app type from keywords
        prompt_lower = prompt.lower()
        for app_type, keywords in app_types.items():
            if any(keyword in prompt_lower for keyword in keywords):
                return app_type, app_name
        
        # If no clear match, use LLM to determine app type
        prompt_for_llm = f"""
        Analyze this app description and determine the type of application.
        Choose one from: crm, ecommerce, blog, or other.
        If other, provide a short descriptor.
        
        Description: {prompt}
        
        Return in JSON format:
        {{
          "app_type": "type name",
          "app_name": "suggested name based on description"
        }}
        """
        
        response = self.llm_client.generate(prompt_for_llm, temperature=0.2)
        try:
            result = json.loads(response)
            return result.get("app_type", "custom"), result.get("app_name", app_name)
        except:
            # Fallback to custom app type if LLM response parsing fails
            return "custom", app_name
    
    def _extract_entities(self, prompt: str, app_type: str) -> List[Entity]:
        """
        Extract entities and their fields from the prompt.
        
        Args:
            prompt: Natural language prompt
            app_type: Identified application type
            
        Returns:
            List of entities with their fields
        """
        # First, check if we can use templates for the app type
        if app_type in self.common_app_patterns["app_types"]:
            template_entities = self.common_app_patterns["app_types"][app_type]["entities"]
            entities = []
            
            for entity_name in template_entities:
                # Use template if available
                if entity_name in self.common_app_patterns["entity_templates"]:
                    template = self.common_app_patterns["entity_templates"][entity_name]
                    entities.append(Entity(
                        name=entity_name,
                        fields=template["fields"],
                        description=f"Standard {entity_name} entity"
                    ))
                else:
                    # Create a basic entity if no template exists
                    entities.append(Entity(
                        name=entity_name,
                        fields=[
                            {"name": "id", "type": "uuid", "primary_key": True},
                            {"name": "name", "type": "string"},
                            {"name": "created_at", "type": "datetime"},
                            {"name": "updated_at", "type": "datetime"}
                        ],
                        description=f"{entity_name} entity"
                    ))
            
            # In a real implementation, we would use the LLM to refine these entities
            # based on the specific requirements in the prompt
            
            return entities
        
        # If no template exists, use LLM to extract entities
        prompt_for_llm = f"""
        Analyze this app description and extract all entities that should be modeled in the database.
        For each entity, identify potential fields with their types.
        
        Description: {prompt}
        
        Return in JSON format:
        {{
          "entities": [
            {{
              "name": "EntityName",
              "description": "Brief description of the entity",
              "fields": [
                {{"name": "id", "type": "uuid", "primary_key": true}},
                {{"name": "field_name", "type": "field_type", "description": "field description", "required": true/false}}
              ]
            }}
          ]
        }}
        """
        
        response = self.llm_client.generate(prompt_for_llm, temperature=0.2)
        try:
            result = json.loads(response)
            return [Entity(**entity) for entity in result.get("entities", [])]
        except:
            # Fallback to basic User entity if parsing fails
            return [Entity(
                name="User",
                fields=self.common_app_patterns["entity_templates"]["User"]["fields"],
                description="User account"
            )]
    
    def _extract_relationships(self, prompt: str, entities: List[Entity], app_type: str) -> List[Relationship]:
        """
        Extract relationships between entities from the prompt.
        
        Args:
            prompt: Natural language prompt
            entities: List of extracted entities
            app_type: Identified application type
            
        Returns:
            List of relationships between entities
        """
        # Use template relationships if available
        if app_type in self.common_app_patterns["app_types"]:
            template_relationships = self.common_app_patterns["app_types"][app_type]["relationships"]
            
            # Filter to include only relationships between entities that we've extracted
            entity_names = [entity.name for entity in entities]
            relationships = []
            
            for rel in template_relationships:
                if rel["from"] in entity_names and rel["to"] in entity_names:
                    relationships.append(Relationship(
                        source=rel["from"],
                        target=rel["to"],
                        type=rel["type"],
                        description=f"{rel['from']} {rel['type'].replace('_', ' ')} {rel['to']}"
                    ))
            
            return relationships
        
        # If no template exists, use LLM to extract relationships
        entity_names = [entity.name for entity in entities]
        prompt_for_llm = f"""
        Analyze this app description and identify relationships between entities.
        Consider these entities: {", ".join(entity_names)}
        
        Relationship types:
        - one_to_one
        - one_to_many
        - many_to_one
        - many_to_many
        
        Description: {prompt}
        
        Return in JSON format:
        {{
          "relationships": [
            {{
              "source": "EntityName1",
              "target": "EntityName2",
              "type": "relationship_type",
              "description": "Description of relationship"
            }}
          ]
        }}
        """
        
        response = self.llm_client.generate(prompt_for_llm, temperature=0.2)
        try:
            result = json.loads(response)
            return [Relationship(**rel) for rel in result.get("relationships", [])]
        except:
            # Return empty list if parsing fails
            return []
    
    def _extract_features(self, prompt: str, app_type: str) -> List[Feature]:
        """
        Extract application features from the prompt.
        
        Args:
            prompt: Natural language prompt
            app_type: Identified application type
            
        Returns:
            List of application features
        """
        # Use template features if available
        if app_type in self.common_app_patterns["app_types"]:
            template_features = self.common_app_patterns["app_types"][app_type]["features"]
            features = []
            
            for feature_name in template_features:
                features.append(Feature(
                    name=feature_name,
                    description=f"Standard {feature_name} feature",
                    required=feature_name == "authentication"  # Authentication is typically required
                ))
            
            # Check for additional features mentioned in the prompt
            common_features = {
                "payment": ["payment", "stripe", "paypal", "checkout"],
                "search": ["search", "filter", "find"],
                "reporting": ["report", "dashboard", "analytics", "chart"],
                "file_upload": ["file", "upload", "image", "document"],
                "notifications": ["notification", "alert", "email", "sms"],
                "api": ["api", "rest", "graphql", "webhook"]
            }
            
            prompt_lower = prompt.lower()
            for feature, keywords in common_features.items():
                if any(keyword in prompt_lower for keyword in keywords):
                    # Only add if not already in features
                    if not any(f.name == feature for f in features):
                        features.append(Feature(
                            name=feature,
                            description=f"{feature.replace('_', ' ').capitalize()} functionality",
                            required=False
                        ))
            
            return features
        
        # If no template exists, use LLM to extract features
        prompt_for_llm = f"""
        Analyze this app description and identify the key features the application should have.
        Common features include: authentication, search, payment, reporting, file_upload, notifications, api, etc.
        
        Description: {prompt}
        
        Return in JSON format:
        {{
          "features": [
            {{
              "name": "feature_name",
              "description": "Description of the feature",
              "required": true/false
            }}
          ]
        }}
        """
        
        response = self.llm_client.generate(prompt_for_llm, temperature=0.2)
        try:
            result = json.loads(response)
            return [Feature(**feature) for feature in result.get("features", [])]
        except:
            # Return basic authentication feature if parsing fails
            return [Feature(
                name="authentication",
                description="User authentication and authorization",
                required=True
            )]
    
    def _extract_business_rules(self, prompt: str, entities: List[Entity], relationships: List[Relationship]) -> List[BusinessRule]:
        """
        Extract business rules from the prompt.
        
        Args:
            prompt: Natural language prompt
            entities: List of extracted entities
            relationships: List of extracted relationships
            
        Returns:
            List of business rules
        """
        # For complex business rules, we need to use the LLM
        entity_names = [entity.name for entity in entities]
        
        prompt_for_llm = f"""
        Analyze this app description and identify key business rules that should be implemented.
        Consider these entities: {", ".join(entity_names)}
        
        Business rules might include:
        - Validation rules (e.g., "Email must be valid")
        - Process rules (e.g., "Orders must be approved before shipping")
        - Calculation rules (e.g., "Total price includes tax")
        - Security rules (e.g., "Only admins can delete users")
        
        Description: {prompt}
        
        Return in JSON format:
        {{
          "business_rules": [
            {{
              "name": "rule_name",
              "description": "Description of the rule",
              "entities_involved": ["Entity1", "Entity2"],
              "rule_type": "validation|process|calculation|security"
            }}
          ]
        }}
        """
        
        response = self.llm_client.generate(prompt_for_llm, temperature=0.3)
        try:
            result = json.loads(response)
            return [BusinessRule(**rule) for rule in result.get("business_rules", [])]
        except:
            # Return empty list if parsing fails
            return []
    
    def _generate_description(self, prompt: str, app_type: str) -> str:
        """
        Generate a concise description of the application.
        
        Args:
            prompt: Natural language prompt
            app_type: Identified application type
            
        Returns:
            Concise application description
        """
        prompt_for_llm = f"""
        Based on this app description, generate a concise 1-2 sentence summary of the application.
        
        App type: {app_type}
        Description: {prompt}
        
        Return just the summary text.
        """
        
        response = self.llm_client.generate(prompt_for_llm, temperature=0.3)
        return response.strip() or f"A {app_type} application"

def parse_prompt(prompt_text: str) -> Dict[str, Any]:
    """
    Main entry point for the prompt parser.
    
    Args:
        prompt_text: Natural language prompt
        
    Returns:
        Structured app specification as a dictionary
    """
    parser = PromptParser()
    app_spec = parser.parse_prompt(prompt_text)
    
    # Convert to dictionary format
    return app_spec.to_dict()

def save_specification(specification: Dict[str, Any], output_format: str = "json", output_path: Optional[str] = None) -> str:
    """
    Save the specification to a file or return as a string.
    
    Args:
        specification: Application specification
        output_format: Format to save as ('json' or 'yaml')
        output_path: Path to save to (if None, returns as string)
        
    Returns:
        Path to saved file or specification string
    """
    if output_format.lower() == "json":
        result = json.dumps(specification, indent=2)
    else:  # yaml
        result = yaml.dump(specification, default_flow_style=False)
    
    if output_path:
        with open(output_path, "w") as f:
            f.write(result)
        return output_path
    
    return result


# Example usage
if __name__ == "__main__":
    test_prompt = "Create a CRM system for a sales team with customers, contacts, and deals tracking."
    spec = parse_prompt(test_prompt)
    print(save_specification(spec, output_format="yaml"))