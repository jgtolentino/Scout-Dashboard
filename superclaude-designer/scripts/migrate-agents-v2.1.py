#!/usr/bin/env python3
"""
Agent Migration Script: v1.0 → v2.1
SuperClaude Designer Framework Enhancement

Automatically migrates agents from Schema v1.0 to v2.1 by:
1. Preserving all v1.0 fields (backward compatibility)
2. Adding v2.1 enhancements with sensible defaults
3. Restructuring capabilities from list to core/specialized/experimental
4. Expanding tools from list to required/optional/mcp_servers
5. Adding constitutional compliance, task routing, quality metrics, acceptance criteria
"""

import os
import sys
import yaml
import argparse
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

# ============================================================================
# MIGRATION CONFIGURATION
# ============================================================================

SCHEMA_VERSION = "2.1.0"
MIGRATION_DATE = datetime.now().isoformat()

DEFAULT_CONSTITUTIONAL_COMPLIANCE = {
    "article_i_spec_authority": True,
    "article_iii_test_first": True,
    "article_iv_incremental": True,
    "article_v_independent_test": True,
    "article_vi_evidence_based": True
}

DEFAULT_TASK_ROUTING = {
    "priority_levels": ["P1", "P2", "P3"],
    "default_priority": "P1",
    "escalation_threshold": 0.8
}

DEFAULT_QUALITY_METRICS = {
    "validation_score": 0.950,  # Conservative default
    "test_coverage": 0.950,
    "spec_compliance": 0.990,
    "performance_rating": 0.900
}

# ============================================================================
# CAPABILITY MAPPING (v1.0 list → v2.1 core/specialized)
# ============================================================================

CORE_CAPABILITIES = [
    "scaffold", "analyze", "refactor", "test", "profile",
    "document", "deploy", "monitor"
]

SPECIALIZED_CAPABILITIES_BY_DOMAIN = {
    "performance": [
        "optimize-web-vitals", "optimize-bundle", "optimize-rendering",
        "optimize-images", "profile-runtime"
    ],
    "design": [
        "generate-tokens", "sync-figma", "validate-components",
        "audit-design-consistency"
    ],
    "accessibility": [
        "audit-wcag", "test-screen-readers", "audit-keyboard-nav"
    ],
    "security": [
        "scan-vulnerabilities", "audit-authentication", "encrypt-data"
    ],
    "testing": [
        "generate-e2e-tests", "visual-regression-test", "load-test"
    ],
    "documentation": [
        "generate-api-docs", "localize-content", "maintain-changelog"
    ],
    "infrastructure": [
        "setup-ci-cd", "orchestrate-containers", "monitor-logs"
    ]
}

# ============================================================================
# MIGRATION FUNCTIONS
# ============================================================================

def load_agent_yaml(file_path: Path) -> Dict[str, Any]:
    """Load agent YAML file"""
    with open(file_path, 'r') as f:
        return yaml.safe_load(f)

def save_agent_yaml(file_path: Path, agent_data: Dict[str, Any]):
    """Save agent YAML file with pretty formatting"""
    with open(file_path, 'w') as f:
        yaml.dump(agent_data, f, default_flow_style=False, sort_keys=False, indent=2)

def migrate_capabilities(old_capabilities: List[str], department: str) -> Dict[str, List[str]]:
    """
    Migrate v1.0 capabilities list to v2.1 core/specialized structure

    Args:
        old_capabilities: List of capabilities from v1.0
        department: Agent department for specialized capability inference

    Returns:
        Dict with core, specialized, experimental lists
    """
    # Separate core vs non-core
    core = [cap for cap in old_capabilities if cap in CORE_CAPABILITIES]
    non_core = [cap for cap in old_capabilities if cap not in CORE_CAPABILITIES]

    # Infer specialized capabilities based on department
    specialized = non_core.copy()
    if department in SPECIALIZED_CAPABILITIES_BY_DOMAIN:
        # Add 2-3 domain-specific specialized capabilities
        domain_caps = SPECIALIZED_CAPABILITIES_BY_DOMAIN[department][:3]
        specialized.extend(domain_caps)

    return {
        "core": core if core else ["analyze", "test"],  # Minimum core
        "specialized": list(set(specialized)),  # Deduplicate
        "experimental": []  # Empty by default
    }

def migrate_tools(old_tools: List[str], routing_mcp: List[str]) -> Dict[str, List[str]]:
    """
    Migrate v1.0 tools list to v2.1 required/optional/mcp_servers structure

    Args:
        old_tools: List of tools from v1.0
        routing_mcp: MCP servers from routing section

    Returns:
        Dict with required, optional, mcp_servers lists
    """
    # All old tools become required (conservative)
    required = old_tools.copy()

    # MCP servers from routing
    mcp_servers = routing_mcp.copy() if routing_mcp else []

    return {
        "required": required if required else ["fs"],  # Minimum required
        "optional": [],  # Empty by default
        "mcp_servers": mcp_servers
    }

def infer_acceptance_criteria(agent_name: str, description: str) -> Dict[str, Any]:
    """
    Generate basic acceptance criteria for agent

    Args:
        agent_name: Agent name
        description: Agent description

    Returns:
        Dict with acceptance criteria structure
    """
    return {
        "format": "given-when-then",
        "test_scenarios": [
            {
                "given": f"Agent {agent_name} is initialized",
                "when": "Core capability is invoked",
                "then": "Operation completes successfully with expected output",
                "priority": "P1"
            }
        ],
        "evidence_requirements": [
            "test-results",
            "coverage-report",
            "validation-score"
        ]
    }

def migrate_agent(agent_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Migrate agent from v1.0 to v2.1

    Args:
        agent_data: Agent data dict from v1.0 YAML

    Returns:
        Migrated agent data dict for v2.1
    """
    agent = agent_data.get("agent", {})

    # Preserve all v1.0 fields
    migrated = agent.copy()

    # Update version to 2.1.0
    migrated["version"] = SCHEMA_VERSION

    # Migrate capabilities: list → core/specialized/experimental
    if "capabilities" in migrated and isinstance(migrated["capabilities"], list):
        old_capabilities = migrated["capabilities"]
        department = migrated.get("department", "engineering")
        migrated["capabilities"] = migrate_capabilities(old_capabilities, department)

    # Migrate tools: list → required/optional/mcp_servers
    if "tools" in migrated and isinstance(migrated["tools"], list):
        old_tools = migrated["tools"]
        routing_mcp = migrated.get("routing", {}).get("mcp", [])
        migrated["tools"] = migrate_tools(old_tools, routing_mcp)

    # Add constitutional compliance (all defaults to True)
    if "constitutional_compliance" not in migrated:
        migrated["constitutional_compliance"] = DEFAULT_CONSTITUTIONAL_COMPLIANCE.copy()

    # Add task routing (defaults)
    if "task_routing" not in migrated:
        migrated["task_routing"] = DEFAULT_TASK_ROUTING.copy()

    # Add quality metrics (conservative defaults)
    if "quality_metrics" not in migrated:
        migrated["quality_metrics"] = DEFAULT_QUALITY_METRICS.copy()

    # Add acceptance criteria (basic template)
    if "acceptance_criteria" not in migrated:
        migrated["acceptance_criteria"] = infer_acceptance_criteria(
            migrated.get("name", "unknown"),
            migrated.get("description", "")
        )

    return {"agent": migrated}

# ============================================================================
# BATCH MIGRATION
# ============================================================================

def migrate_directory(input_dir: Path, output_dir: Path = None, dry_run: bool = False):
    """
    Migrate all agents in directory from v1.0 to v2.1

    Args:
        input_dir: Directory containing v1.0 agent YAML files
        output_dir: Output directory (defaults to input_dir + "_v2.1")
        dry_run: If True, only print what would be done
    """
    input_dir = Path(input_dir)
    if output_dir is None:
        output_dir = input_dir.parent / f"{input_dir.name}_v2.1"
    else:
        output_dir = Path(output_dir)

    # Find all YAML files
    yaml_files = list(input_dir.glob("*.yaml")) + list(input_dir.glob("*.yml"))

    print(f"🔍 Found {len(yaml_files)} agent files in {input_dir}")
    print(f"📦 Output directory: {output_dir}")
    print(f"🚀 Migration mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print()

    if not dry_run:
        output_dir.mkdir(parents=True, exist_ok=True)

    migrated_count = 0
    failed_count = 0

    for yaml_file in yaml_files:
        try:
            print(f"📄 Processing: {yaml_file.name}")

            # Load v1.0 agent
            agent_data = load_agent_yaml(yaml_file)

            # Migrate to v2.1
            migrated_data = migrate_agent(agent_data)

            if dry_run:
                print(f"   ✓ Would migrate to v2.1")
            else:
                # Save v2.1 agent
                output_file = output_dir / yaml_file.name
                save_agent_yaml(output_file, migrated_data)
                print(f"   ✅ Migrated to {output_file}")

            migrated_count += 1

        except Exception as e:
            print(f"   ❌ Failed: {str(e)}")
            failed_count += 1

        print()

    print("=" * 60)
    print(f"✅ Successfully migrated: {migrated_count}")
    print(f"❌ Failed: {failed_count}")
    print(f"📊 Total: {len(yaml_files)}")
    print("=" * 60)

# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Migrate SuperClaude agents from Schema v1.0 to v2.1",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Migrate single agent
  python migrate-agents-v2.1.py agents/frontend-developer.yaml

  # Migrate entire directory (dry run)
  python migrate-agents-v2.1.py agents/ --dry-run

  # Migrate directory to specific output location
  python migrate-agents-v2.1.py agents/ --output agents_v2.1/

  # Migrate with verbose output
  python migrate-agents-v2.1.py agents/ --verbose
        """
    )

    parser.add_argument(
        "input",
        type=str,
        help="Input agent file or directory"
    )

    parser.add_argument(
        "--output", "-o",
        type=str,
        default=None,
        help="Output directory (default: input_v2.1)"
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview migration without writing files"
    )

    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Verbose output"
    )

    args = parser.parse_args()

    input_path = Path(args.input)

    # Single file migration
    if input_path.is_file():
        print(f"🔄 Migrating single file: {input_path}")

        agent_data = load_agent_yaml(input_path)
        migrated_data = migrate_agent(agent_data)

        if args.dry_run:
            print("✓ Dry run: Would migrate to v2.1")
            print(yaml.dump(migrated_data, default_flow_style=False, sort_keys=False, indent=2))
        else:
            output_file = input_path.parent / f"{input_path.stem}_v2.1{input_path.suffix}"
            if args.output:
                output_file = Path(args.output)

            save_agent_yaml(output_file, migrated_data)
            print(f"✅ Migrated to: {output_file}")

    # Directory migration
    elif input_path.is_dir():
        migrate_directory(input_path, args.output, args.dry_run)

    else:
        print(f"❌ Error: {input_path} is not a valid file or directory")
        sys.exit(1)

if __name__ == "__main__":
    main()
