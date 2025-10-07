#!/usr/bin/env python3
"""
Schema v2.1 Validation Script for SuperClaude Designer Agents

Validates all agent YAML files against Schema v2.1 specification.
Generates comprehensive validation report with quality metrics.

Usage:
    python3 validate-agents-v2.1.py agents/*.yaml --report validation-report.json
    python3 validate-agents-v2.1.py agents/ --recursive --verbose
"""

import yaml
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass, asdict

@dataclass
class ValidationResult:
    """Validation result for a single agent"""
    agent_name: str
    file_path: str
    is_valid: bool
    schema_version: str
    errors: List[str]
    warnings: List[str]
    quality_score: float
    constitutional_compliance: Dict[str, bool]
    metrics: Dict[str, Any]

class SchemaValidator:
    """Validates agents against Schema v2.1"""

    REQUIRED_FIELDS = {
        "agent": {
            "name": str,
            "version": str,
            "description": str,
            "type": str,
            "department": str,
            "capabilities": dict,
            "tools": dict,
            "permissions": dict,
        }
    }

    VALID_TYPES = ["specialist", "traditional", "edge_function", "orchestrator"]
    VALID_DEPARTMENTS = [
        "engineering", "design", "quality", "security", "performance",
        "documentation", "infrastructure", "testing", "data", "ai-ml"
    ]

    CORE_CAPABILITIES = [
        "scaffold", "analyze", "refactor", "test", "profile",
        "document", "deploy", "monitor"
    ]

    CONSTITUTIONAL_ARTICLES = [
        "article_i_spec_authority",
        "article_iii_test_first",
        "article_iv_incremental",
        "article_v_independent_test",
        "article_vi_evidence_based"
    ]

    QUALITY_METRICS = [
        "validation_score",
        "test_coverage",
        "spec_compliance",
        "performance_rating"
    ]

    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.results: List[ValidationResult] = []

    def validate_file(self, file_path: Path) -> ValidationResult:
        """Validate a single agent file"""
        errors = []
        warnings = []

        try:
            with open(file_path, 'r') as f:
                data = yaml.safe_load(f)
        except Exception as e:
            return ValidationResult(
                agent_name="unknown",
                file_path=str(file_path),
                is_valid=False,
                schema_version="unknown",
                errors=[f"Failed to parse YAML: {str(e)}"],
                warnings=[],
                quality_score=0.0,
                constitutional_compliance={},
                metrics={}
            )

        # Extract agent data
        if "agent" not in data:
            errors.append("Missing root 'agent' key")
            return ValidationResult(
                agent_name="unknown",
                file_path=str(file_path),
                is_valid=False,
                schema_version="unknown",
                errors=errors,
                warnings=warnings,
                quality_score=0.0,
                constitutional_compliance={},
                metrics={}
            )

        agent = data["agent"]
        agent_name = agent.get("name", "unknown")
        schema_version = agent.get("version", "unknown")

        # Validate required fields
        errors.extend(self._validate_required_fields(agent))

        # Validate field types and values
        errors.extend(self._validate_field_types(agent))
        warnings.extend(self._validate_field_values(agent))

        # Validate capabilities structure
        errors.extend(self._validate_capabilities(agent))

        # Validate tools structure
        errors.extend(self._validate_tools(agent))

        # Validate constitutional compliance
        constitutional_compliance = self._validate_constitutional_compliance(agent)
        if not all(constitutional_compliance.values()):
            warnings.append("Incomplete constitutional compliance")

        # Validate quality metrics
        quality_errors, quality_metrics = self._validate_quality_metrics(agent)
        errors.extend(quality_errors)

        # Calculate composite quality score
        quality_score = self._calculate_quality_score(quality_metrics)

        # Validate acceptance criteria
        errors.extend(self._validate_acceptance_criteria(agent))

        is_valid = len(errors) == 0

        if self.verbose:
            print(f"{'✅' if is_valid else '❌'} {agent_name} ({schema_version})")
            if errors:
                for error in errors:
                    print(f"  ❌ {error}")
            if warnings:
                for warning in warnings:
                    print(f"  ⚠️  {warning}")

        return ValidationResult(
            agent_name=agent_name,
            file_path=str(file_path),
            is_valid=is_valid,
            schema_version=schema_version,
            errors=errors,
            warnings=warnings,
            quality_score=quality_score,
            constitutional_compliance=constitutional_compliance,
            metrics=quality_metrics
        )

    def _validate_required_fields(self, agent: Dict[str, Any]) -> List[str]:
        """Validate all required fields are present"""
        errors = []
        for field, field_type in self.REQUIRED_FIELDS["agent"].items():
            if field not in agent:
                errors.append(f"Missing required field: {field}")
            elif not isinstance(agent[field], field_type):
                errors.append(f"Invalid type for {field}: expected {field_type.__name__}, got {type(agent[field]).__name__}")
        return errors

    def _validate_field_types(self, agent: Dict[str, Any]) -> List[str]:
        """Validate field types and structure"""
        errors = []

        # Validate type
        if agent.get("type") not in self.VALID_TYPES:
            errors.append(f"Invalid agent type: {agent.get('type')}. Must be one of {self.VALID_TYPES}")

        # Validate department
        if agent.get("department") not in self.VALID_DEPARTMENTS:
            errors.append(f"Invalid department: {agent.get('department')}. Must be one of {self.VALID_DEPARTMENTS}")

        # Validate version format
        version = agent.get("version", "")
        if not version.startswith("2.1"):
            errors.append(f"Invalid schema version: {version}. Must be 2.1.x")

        return errors

    def _validate_field_values(self, agent: Dict[str, Any]) -> List[str]:
        """Validate field values for warnings"""
        warnings = []

        # Check description length
        description = agent.get("description", "")
        if len(description) < 20:
            warnings.append("Description is too short (< 20 characters)")
        elif len(description) > 200:
            warnings.append("Description is very long (> 200 characters)")

        return warnings

    def _validate_capabilities(self, agent: Dict[str, Any]) -> List[str]:
        """Validate capabilities structure"""
        errors = []
        capabilities = agent.get("capabilities", {})

        if not isinstance(capabilities, dict):
            errors.append("capabilities must be a dictionary with core/specialized/experimental")
            return errors

        # Check for required capability categories
        if "core" not in capabilities:
            errors.append("Missing capabilities.core")
        elif not isinstance(capabilities["core"], list):
            errors.append("capabilities.core must be a list")
        else:
            # Validate core capabilities are from allowed set
            invalid_core = [cap for cap in capabilities["core"] if cap not in self.CORE_CAPABILITIES]
            if invalid_core:
                errors.append(f"Invalid core capabilities: {invalid_core}")

        if "specialized" not in capabilities:
            errors.append("Missing capabilities.specialized")
        elif not isinstance(capabilities["specialized"], list):
            errors.append("capabilities.specialized must be a list")

        if "experimental" not in capabilities:
            errors.append("Missing capabilities.experimental")
        elif not isinstance(capabilities["experimental"], list):
            errors.append("capabilities.experimental must be a list")

        return errors

    def _validate_tools(self, agent: Dict[str, Any]) -> List[str]:
        """Validate tools structure"""
        errors = []
        tools = agent.get("tools", {})

        if not isinstance(tools, dict):
            errors.append("tools must be a dictionary with required/optional/mcp_servers")
            return errors

        # Check for required tool categories
        if "required" not in tools:
            errors.append("Missing tools.required")
        elif not isinstance(tools["required"], list):
            errors.append("tools.required must be a list")

        if "optional" not in tools:
            errors.append("Missing tools.optional")
        elif not isinstance(tools["optional"], list):
            errors.append("tools.optional must be a list")

        if "mcp_servers" not in tools:
            errors.append("Missing tools.mcp_servers")
        elif not isinstance(tools["mcp_servers"], list):
            errors.append("tools.mcp_servers must be a list")

        return errors

    def _validate_constitutional_compliance(self, agent: Dict[str, Any]) -> Dict[str, bool]:
        """Validate constitutional compliance"""
        compliance = agent.get("constitutional_compliance", {})

        result = {}
        for article in self.CONSTITUTIONAL_ARTICLES:
            result[article] = compliance.get(article, False)

        return result

    def _validate_quality_metrics(self, agent: Dict[str, Any]) -> Tuple[List[str], Dict[str, float]]:
        """Validate quality metrics"""
        errors = []
        metrics = agent.get("quality_metrics", {})

        result = {}
        for metric in self.QUALITY_METRICS:
            if metric not in metrics:
                errors.append(f"Missing quality metric: {metric}")
                result[metric] = 0.0
            else:
                value = metrics[metric]
                if not isinstance(value, (int, float)):
                    errors.append(f"Invalid type for {metric}: must be numeric")
                    result[metric] = 0.0
                elif value < 0.0 or value > 1.0:
                    errors.append(f"Invalid value for {metric}: must be between 0.0 and 1.0")
                    result[metric] = 0.0
                else:
                    result[metric] = float(value)

        return errors, result

    def _calculate_quality_score(self, metrics: Dict[str, float]) -> float:
        """Calculate composite quality score using validation methodology"""
        test_coverage = metrics.get("test_coverage", 0.0)
        spec_compliance = metrics.get("spec_compliance", 0.0)
        performance_rating = metrics.get("performance_rating", 0.0)

        # Formula from validation-scoring-methodology-v2.1.yaml
        composite_score = (test_coverage * 0.4) + (spec_compliance * 0.35) + (performance_rating * 0.25)

        return round(composite_score, 3)

    def _validate_acceptance_criteria(self, agent: Dict[str, Any]) -> List[str]:
        """Validate acceptance criteria structure"""
        errors = []
        criteria = agent.get("acceptance_criteria", {})

        if not isinstance(criteria, dict):
            errors.append("acceptance_criteria must be a dictionary")
            return errors

        # Validate format
        if criteria.get("format") != "given-when-then":
            errors.append("acceptance_criteria.format must be 'given-when-then'")

        # Validate test scenarios
        if "test_scenarios" not in criteria:
            errors.append("Missing acceptance_criteria.test_scenarios")
        elif not isinstance(criteria["test_scenarios"], list):
            errors.append("acceptance_criteria.test_scenarios must be a list")

        # Validate evidence requirements
        if "evidence_requirements" not in criteria:
            errors.append("Missing acceptance_criteria.evidence_requirements")
        elif not isinstance(criteria["evidence_requirements"], list):
            errors.append("acceptance_criteria.evidence_requirements must be a list")

        return errors

    def validate_directory(self, directory: Path, recursive: bool = False) -> List[ValidationResult]:
        """Validate all YAML files in directory"""
        pattern = "**/*.yaml" if recursive else "*.yaml"
        yaml_files = list(directory.glob(pattern))

        if self.verbose:
            print(f"\n🔍 Validating {len(yaml_files)} agent files from {directory}\n")

        results = []
        for file_path in yaml_files:
            result = self.validate_file(file_path)
            results.append(result)
            self.results.append(result)

        return results

    def generate_report(self, output_path: Path = None) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        total = len(self.results)
        valid = sum(1 for r in self.results if r.is_valid)
        invalid = total - valid

        # Calculate averages
        avg_quality_score = sum(r.quality_score for r in self.results) / total if total > 0 else 0.0

        avg_metrics = {}
        for metric in self.QUALITY_METRICS:
            values = [r.metrics.get(metric, 0.0) for r in self.results]
            avg_metrics[metric] = sum(values) / len(values) if values else 0.0

        # Constitutional compliance summary
        constitutional_summary = {}
        for article in self.CONSTITUTIONAL_ARTICLES:
            compliant = sum(1 for r in self.results if r.constitutional_compliance.get(article, False))
            constitutional_summary[article] = {
                "compliant": compliant,
                "non_compliant": total - compliant,
                "percentage": (compliant / total * 100) if total > 0 else 0.0
            }

        # Group results by status
        valid_agents = [r for r in self.results if r.is_valid]
        invalid_agents = [r for r in self.results if not r.is_valid]

        report = {
            "summary": {
                "total_agents": total,
                "valid": valid,
                "invalid": invalid,
                "validation_rate": (valid / total * 100) if total > 0 else 0.0,
                "avg_quality_score": round(avg_quality_score, 3)
            },
            "quality_metrics": {
                "averages": {k: round(v, 3) for k, v in avg_metrics.items()}
            },
            "constitutional_compliance": constitutional_summary,
            "valid_agents": [
                {
                    "name": r.agent_name,
                    "file": r.file_path,
                    "version": r.schema_version,
                    "quality_score": r.quality_score,
                    "warnings": len(r.warnings)
                }
                for r in valid_agents
            ],
            "invalid_agents": [
                {
                    "name": r.agent_name,
                    "file": r.file_path,
                    "version": r.schema_version,
                    "errors": r.errors,
                    "warnings": r.warnings
                }
                for r in invalid_agents
            ]
        }

        if output_path:
            with open(output_path, 'w') as f:
                json.dump(report, f, indent=2)
            if self.verbose:
                print(f"\n📊 Report saved to: {output_path}")

        return report

    def print_summary(self):
        """Print validation summary to console"""
        total = len(self.results)
        valid = sum(1 for r in self.results if r.is_valid)
        invalid = total - valid

        print("\n" + "="*70)
        print("SCHEMA v2.1 VALIDATION SUMMARY")
        print("="*70)
        print(f"Total Agents:     {total}")
        print(f"Valid:            {valid} ✅")
        print(f"Invalid:          {invalid} ❌")
        print(f"Validation Rate:  {(valid/total*100):.1f}%")

        if total > 0:
            avg_quality = sum(r.quality_score for r in self.results) / total
            print(f"Avg Quality:      {avg_quality:.3f}")

        # Constitutional compliance
        print("\nConstitutional Compliance:")
        for article in self.CONSTITUTIONAL_ARTICLES:
            compliant = sum(1 for r in self.results if r.constitutional_compliance.get(article, False))
            percentage = (compliant / total * 100) if total > 0 else 0.0
            status = "✅" if percentage == 100.0 else "⚠️"
            print(f"  {status} {article}: {compliant}/{total} ({percentage:.1f}%)")

        print("="*70 + "\n")

def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Validate SuperClaude Designer agents against Schema v2.1"
    )
    parser.add_argument(
        "paths",
        nargs="+",
        type=Path,
        help="Agent YAML files or directories to validate"
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        help="Recursively search directories for YAML files"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Verbose output"
    )
    parser.add_argument(
        "--report",
        type=Path,
        help="Output path for JSON validation report"
    )

    args = parser.parse_args()

    validator = SchemaValidator(verbose=args.verbose)

    # Validate all provided paths
    for path in args.paths:
        if path.is_file():
            validator.validate_file(path)
        elif path.is_dir():
            validator.validate_directory(path, recursive=args.recursive)
        else:
            print(f"⚠️  Path not found: {path}", file=sys.stderr)

    # Generate report
    report = validator.generate_report(output_path=args.report)

    # Print summary
    validator.print_summary()

    # Exit with error code if any agents are invalid
    sys.exit(0 if report["summary"]["invalid"] == 0 else 1)

if __name__ == "__main__":
    main()
