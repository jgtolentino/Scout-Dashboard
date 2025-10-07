# SuperClaude Designer Framework Documentation
## Complete Guide to Schema v2.1 and Multi-Agent Orchestration

**Version**: 2.1.0
**Last Updated**: 2025-10-07
**Status**: Production Ready

---

## Table of Contents

1. [Framework Overview](#framework-overview)
2. [Architecture](#architecture)
3. [Schema v2.1 Specification](#schema-v21-specification)
4. [Agent Creation Guide](#agent-creation-guide)
5. [Migration Guide](#migration-guide)
6. [Validation Guide](#validation-guide)
7. [Orchestration Guide](#orchestration-guide)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Reference](#reference)

---

## Framework Overview

SuperClaude Designer is a multi-agent orchestration framework that enables coordinated AI agent collaboration through standardized schemas, constitutional principles, and quality-driven development practices.

### Key Features

- **Schema-Driven Development**: Standardized YAML schema for agent definitions
- **Constitutional Compliance**: Built-in adherence to spec-kit development principles
- **Quality Metrics**: Composite scoring system for agent quality assessment
- **Priority Routing**: P1/P2/P3 task routing with intelligent escalation
- **Multi-Agent Coordination**: Wave-based orchestration with parallel execution
- **Tool Integration**: Comprehensive MCP server and external tool support

### Core Principles

1. **Spec-Kit Compliance**: All agents follow spec-driven development (SDD) methodology
2. **Test-First Development**: Tests written before implementation (Article III)
3. **Incremental Delivery**: P1 features before P2/P3 (Article IV)
4. **Independent Testability**: Each feature standalone testable (Article V)
5. **Evidence-Based Validation**: All claims require verifiable evidence (Article VI)

### Framework Capabilities

```yaml
Production Agents: 37 Schema v2.1 agents
Orchestration Power: 1446x (57% improvement from baseline)
Quality Score: 93.0% average
Domains Covered: 10 (engineering, design, performance, testing, etc.)
Specialized Capabilities: 70+ unique capabilities
Tool Integrations: 45+ tools, 4+ MCP servers
Constitutional Compliance: 100%
```

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  SuperClaude Designer                        │
│                  Orchestration Layer                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌───────────┐  ┌──────────┐  ┌──────────┐
│   Wave    │  │  Schema  │  │ Quality  │
│Coordinator│  │Validator │  │ Metrics  │
└─────┬─────┘  └────┬─────┘  └────┬─────┘
      │             │             │
      └─────────────┼─────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Agent   │  │  Agent   │  │  Agent   │
│  Pool    │  │ Registry │  │Lifecycle │
└─────┬────┘  └────┬─────┘  └────┬─────┘
      │            │             │
      └────────────┼─────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
      ▼                         ▼
┌──────────┐            ┌──────────┐
│   MCP    │            │ External │
│ Servers  │            │  Tools   │
└──────────┘            └──────────┘
```

### Component Layers

1. **Orchestration Layer**: Wave-based coordination, parallel execution
2. **Validation Layer**: Schema validation, quality metrics, constitutional compliance
3. **Agent Layer**: 37 production agents with specialized capabilities
4. **Integration Layer**: MCP servers (bruno-supabase, fs, playwright, context7), external tools

### Wave System

The framework uses a 5-wave coordination system for complex multi-agent operations:

```yaml
Wave 1 - Discovery:
  Purpose: Analyze requirements, gather context, assess complexity
  Tools: Read, Grep, Glob, WebFetch
  Output: Discovery synthesis report

Wave 2 - Design:
  Purpose: Schema design, capability taxonomy, validation methodology
  Tools: Write, Read, Edit
  Output: Schema specifications, design documents

Wave 3 - Implementation:
  Purpose: Agent creation, migration, tool integration
  Tools: Write, Edit, MultiEdit, Bash
  Output: Production-ready agents

Wave 4 - Validation:
  Purpose: Schema validation, quality metrics, compliance verification
  Tools: Bash (validation script), Read, Write
  Output: Validation reports, quality metrics

Wave 5 - Documentation:
  Purpose: Framework documentation, consolidation reports, handoff
  Tools: Write, Read, Edit
  Output: Complete documentation package
```

---

## Schema v2.1 Specification

### Complete Schema Structure

```yaml
agent:
  # Core Identity
  name: string                    # Unique agent identifier (kebab-case)
  version: "2.1.0"               # Schema version (MUST be 2.1.x)
  description: string            # Agent purpose (20-200 characters)
  type: enum                     # specialist|traditional|edge_function|orchestrator
  department: enum               # Domain classification

  # Three-Tier Capabilities
  capabilities:
    core: [string]               # 8 core capabilities: scaffold, analyze, refactor, test, profile, document, deploy, monitor
    specialized: [string]        # Domain-specific capabilities (unlimited)
    experimental: [string]       # Beta/cutting-edge capabilities (optional)

  # Three-Category Tools
  tools:
    required: [string]           # Must-have tools for agent operation
    optional: [string]           # Enhancement tools for extended functionality
    mcp_servers: [string]        # MCP server integrations

  # Keywords & Classification
  keywords: [string]             # Search and discovery tags

  # Security & Permissions
  permissions:
    allow_shell: boolean         # Shell command execution permission
    allow_network: boolean       # Network access permission
    allow_credentials: boolean   # Credential management permission

  # Configuration
  config: object                 # Agent-specific configuration (optional)

  # Routing & Orchestration
  routing:
    mcp: [string]                # MCP server routing preferences
    commands: [string]           # Command patterns for agent activation

  # Constitutional Compliance (5 Spec-Kit Articles)
  constitutional_compliance:
    article_i_spec_authority: boolean      # Spec-driven development
    article_iii_test_first: boolean        # Test-first imperative
    article_iv_incremental: boolean        # Incremental delivery
    article_v_independent_test: boolean    # Independent testability
    article_vi_evidence_based: boolean     # Evidence-based validation

  # Task Routing
  task_routing:
    priority_levels: [P1, P2, P3]         # Supported priority levels
    default_priority: P1                   # Default priority for tasks
    escalation_threshold: 0.0-1.0          # Complexity threshold for escalation

  # Quality Metrics (4-Metric System)
  quality_metrics:
    validation_score: 0.0-1.0              # Composite quality score (target: 0.95+)
    test_coverage: 0.0-1.0                 # Test coverage percentage (target: 0.80+)
    spec_compliance: 0.0-1.0               # Spec compliance percentage (target: 0.90+)
    performance_rating: 0.0-1.0            # Performance rating (target: 0.80+)

  # Acceptance Criteria (Given-When-Then Format)
  acceptance_criteria:
    format: given-when-then                # Must be "given-when-then"
    test_scenarios: [object]               # List of test scenarios
      - given: string                      # Initial state
        when: string                       # Action taken
        then: string                       # Expected outcome
        priority: P1|P2|P3                 # Scenario priority
    evidence_requirements: [string]        # Required evidence types
```

### Field Descriptions

#### Core Identity

**`name`** (string, required)
- Unique agent identifier in kebab-case format
- Example: `design-system-architect`, `e2e-test-engineer`
- Must be unique across all agents in the system

**`version`** (string, required)
- Schema version following semantic versioning
- For Schema v2.1, must start with `2.1` (e.g., `2.1.0`)
- Used for validation and migration tracking

**`description`** (string, required)
- Clear, concise agent purpose description
- Length: 20-200 characters
- Should describe primary function and domain
- Example: "End-to-end testing specialist using Playwright"

**`type`** (enum, required)
- Agent type classification
- Values: `specialist` (focused), `traditional` (general), `edge_function` (serverless), `orchestrator` (coordinator)
- Most agents use `traditional`

**`department`** (enum, required)
- Domain classification for agent grouping
- Values: `engineering`, `design`, `quality`, `security`, `performance`, `documentation`, `infrastructure`, `testing`, `data`, `ai-ml`
- Used for routing and coordination

#### Capabilities

**`capabilities.core`** (list, required)
- List of core capabilities from the standard set
- Available: `scaffold`, `analyze`, `refactor`, `test`, `profile`, `document`, `deploy`, `monitor`
- Minimum: 1 core capability (typically 3-5)
- Example: `[scaffold, analyze, test]`

**`capabilities.specialized`** (list, required)
- Domain-specific capabilities unique to agent
- Unlimited count, typically 3-10 per agent
- Must be descriptive and hyphenated
- Example: `[generate-e2e-tests, record-user-journeys, validate-critical-paths]`

**`capabilities.experimental`** (list, required)
- Beta or cutting-edge capabilities under development
- Can be empty list `[]` if no experimental features
- Example: `[predict-performance-regression]`

#### Tools

**`tools.required`** (list, required)
- Essential tools agent cannot function without
- Typically includes: `fs`, `bruno-supabase`, `playwright`, etc.
- Minimum: 1 required tool
- Example: `[fs, playwright]`

**`tools.optional`** (list, required)
- Enhancement tools for extended functionality
- Can be empty list `[]` if no optional tools
- Example: `[chromatic, percy, visual-regression-tracker]`

**`tools.mcp_servers`** (list, required)
- MCP server integrations
- Available: `bruno-supabase`, `fs`, `playwright`, `context7`, `sequential-thinking`, etc.
- Can be empty list `[]` if no MCP integration
- Example: `[bruno-supabase, fs]`

#### Constitutional Compliance

All 5 fields are **boolean, required, typically true**:

- `article_i_spec_authority`: Follows spec-driven development methodology
- `article_iii_test_first`: Implements test-first development
- `article_iv_incremental`: Supports incremental P1→P2→P3 delivery
- `article_v_independent_test`: Features are independently testable
- `article_vi_evidence_based`: Requires verifiable evidence for claims

#### Task Routing

**`task_routing.priority_levels`** (list, required)
- Supported priority levels: `[P1, P2, P3]`
- Most agents support all three levels

**`task_routing.default_priority`** (enum, required)
- Default priority when not specified
- Values: `P1` (critical), `P2` (enhancement), `P3` (nice-to-have)
- Most agents default to `P1`

**`task_routing.escalation_threshold`** (float, required)
- Complexity threshold (0.0-1.0) for escalating to higher priority
- Values: `0.5` (aggressive), `0.7` (balanced), `0.8` (conservative), `0.9` (very conservative)
- Most agents use `0.8`

#### Quality Metrics

All 4 fields are **float (0.0-1.0), required**:

- `validation_score`: Composite quality score (target: 0.95+)
- `test_coverage`: Test coverage percentage (target: 0.80+)
- `spec_compliance`: Spec compliance percentage (target: 0.90+)
- `performance_rating`: Performance rating (target: 0.80+)

**Composite Score Formula**:
```
validation_score = (test_coverage × 0.4) + (spec_compliance × 0.35) + (performance_rating × 0.25)
```

#### Acceptance Criteria

**`acceptance_criteria.format`** (string, required)
- Must be `"given-when-then"` for structured test scenarios

**`acceptance_criteria.test_scenarios`** (list, required)
- List of test scenarios in Given-When-Then format
- Each scenario has: `given`, `when`, `then`, `priority`
- Example:
```yaml
- given: Agent design-system-architect is initialized
  when: Core capability is invoked
  then: Operation completes successfully with expected output
  priority: P1
```

**`acceptance_criteria.evidence_requirements`** (list, required)
- Types of evidence required for validation
- Common values: `test-results`, `coverage-report`, `validation-score`, `performance-metrics`
- Example: `[test-results, coverage-report, validation-score]`

### Schema Validation Rules

1. **Required Fields**: All fields marked as required must be present
2. **Type Checking**: All fields must match specified types (string, list, boolean, float)
3. **Enum Validation**: Enum fields must use allowed values only
4. **Range Validation**: Numeric fields must be within specified ranges (0.0-1.0)
5. **Format Validation**: String fields must follow specified formats (kebab-case, semantic versioning)
6. **Structure Validation**: Nested objects must follow schema structure
7. **Constitutional Compliance**: All 5 articles must be present and typically true
8. **Quality Metrics**: All 4 metrics must be present and within 0.0-1.0 range

---

## Agent Creation Guide

### Step-by-Step Agent Creation

#### 1. Define Agent Identity

```yaml
agent:
  name: my-new-agent              # Unique kebab-case identifier
  version: "2.1.0"                # Schema version
  description: "Brief agent description (20-200 chars)"
  type: traditional               # Agent type
  department: engineering         # Domain classification
```

**Best Practices**:
- Use descriptive names that clearly indicate agent purpose
- Keep descriptions concise but informative
- Choose appropriate department for domain grouping

#### 2. Define Capabilities

```yaml
  capabilities:
    core:
      - analyze                   # Required for most agents
      - test                      # Essential for quality
      - document                  # Good practice for all
    specialized:
      - domain-specific-capability-1
      - domain-specific-capability-2
      - domain-specific-capability-3
    experimental: []              # Empty unless beta features
```

**Guidelines**:
- **Core capabilities**: Choose 3-5 from standard set that match agent purpose
- **Specialized capabilities**: Define 3-10 unique capabilities specific to domain
- **Experimental capabilities**: Only include if beta/cutting-edge features exist

#### 3. Define Tools

```yaml
  tools:
    required:
      - fs                        # File system access (most agents)
      - domain-specific-tool      # Primary tool for agent work
    optional:
      - enhancement-tool-1        # Optional enhancement
      - enhancement-tool-2        # Optional enhancement
    mcp_servers:
      - bruno-supabase            # If database operations needed
      - fs                        # File system MCP
```

**Guidelines**:
- **Required tools**: Only include absolutely essential tools
- **Optional tools**: List tools that enhance but aren't critical
- **MCP servers**: Include all MCP integrations needed

#### 4. Set Constitutional Compliance

```yaml
  constitutional_compliance:
    article_i_spec_authority: true
    article_iii_test_first: true
    article_iv_incremental: true
    article_v_independent_test: true
    article_vi_evidence_based: true
```

**Standard**: All fields should be `true` for production agents

#### 5. Configure Task Routing

```yaml
  task_routing:
    priority_levels:
      - P1
      - P2
      - P3
    default_priority: P1          # Most agents default to P1
    escalation_threshold: 0.8     # Conservative escalation
```

**Guidelines**:
- **default_priority**: Use `P1` for critical agents, `P2` for enhancements
- **escalation_threshold**: Use `0.8` (conservative) for most agents

#### 6. Set Quality Metrics

```yaml
  quality_metrics:
    validation_score: 0.95        # Target: 0.95+
    test_coverage: 0.95           # Target: 0.80+
    spec_compliance: 0.99         # Target: 0.90+
    performance_rating: 0.90      # Target: 0.80+
```

**Guidelines**:
- Set realistic targets based on agent complexity
- Use formula to calculate validation_score if needed
- Higher values indicate higher quality expectations

#### 7. Define Acceptance Criteria

```yaml
  acceptance_criteria:
    format: given-when-then
    test_scenarios:
      - given: Agent my-new-agent is initialized
        when: Core capability is invoked
        then: Operation completes successfully with expected output
        priority: P1
    evidence_requirements:
      - test-results
      - coverage-report
      - validation-score
```

**Guidelines**:
- Define at least one test scenario
- Use clear Given-When-Then format
- Specify all required evidence types

### Complete Agent Example

```yaml
agent:
  name: example-agent
  version: "2.1.0"
  description: "Example agent demonstrating Schema v2.1 structure"
  type: traditional
  department: engineering

  capabilities:
    core:
      - scaffold
      - analyze
      - refactor
      - test
      - document
    specialized:
      - example-capability-1
      - example-capability-2
      - example-capability-3
    experimental: []

  tools:
    required:
      - fs
      - example-tool
    optional:
      - enhancement-tool
    mcp_servers:
      - bruno-supabase
      - fs

  keywords:
    - example
    - demonstration
    - template

  permissions:
    allow_shell: false
    allow_network: false
    allow_credentials: false

  config: {}

  routing:
    mcp:
      - bruno-supabase
      - fs
    commands:
      - spec:run
      - lint
      - test
      - build

  constitutional_compliance:
    article_i_spec_authority: true
    article_iii_test_first: true
    article_iv_incremental: true
    article_v_independent_test: true
    article_vi_evidence_based: true

  task_routing:
    priority_levels:
      - P1
      - P2
      - P3
    default_priority: P1
    escalation_threshold: 0.8

  quality_metrics:
    validation_score: 0.95
    test_coverage: 0.95
    spec_compliance: 0.99
    performance_rating: 0.90

  acceptance_criteria:
    format: given-when-then
    test_scenarios:
      - given: Agent example-agent is initialized
        when: Core capability is invoked
        then: Operation completes successfully with expected output
        priority: P1
    evidence_requirements:
      - test-results
      - coverage-report
      - validation-score
```

### Agent Creation Checklist

- [ ] Choose unique agent name (kebab-case)
- [ ] Set Schema v2.1.0 version
- [ ] Write clear description (20-200 chars)
- [ ] Select appropriate type and department
- [ ] Define 3-5 core capabilities
- [ ] Define 3-10 specialized capabilities
- [ ] List required and optional tools
- [ ] Configure MCP server integrations
- [ ] Set all 5 constitutional compliance flags to true
- [ ] Configure task routing (P1/P2/P3, threshold)
- [ ] Set quality metric targets
- [ ] Define acceptance criteria with test scenarios
- [ ] Validate with `validate-agents-v2.1.py` script

---

## Migration Guide

### Migrating from Schema v1.0 to v2.1

The framework provides an automated migration script that handles most of the conversion process.

#### Migration Tool

**Location**: `scripts/migrate-agents-v2.1.py`

**Usage**:
```bash
# Migrate single agent
python3 scripts/migrate-agents-v2.1.py agents/agent-name.yaml --output agents/agent-name.yaml

# Migrate all agents in directory
for file in agents/*.yaml; do
  python3 scripts/migrate-agents-v2.1.py "$file" --output "$file"
done
```

#### Migration Process

The migration script automatically:

1. **Upgrades version** from `1.0.0` to `2.1.0`
2. **Converts capabilities** from flat list to three-tier structure (core/specialized/experimental)
3. **Converts tools** from flat list to three-category structure (required/optional/mcp_servers)
4. **Adds constitutional compliance** with default values (all true)
5. **Adds task routing** with P1/P2/P3 configuration
6. **Adds quality metrics** with targets based on department
7. **Infers acceptance criteria** based on agent name and description

#### Manual Migration Steps

If migrating manually, follow these steps:

1. **Update version field**:
```yaml
# Before (v1.0)
version: "1.0.0"

# After (v2.1)
version: "2.1.0"
```

2. **Convert capabilities to three-tier structure**:
```yaml
# Before (v1.0)
capabilities:
  - analyze
  - test
  - domain-capability-1
  - domain-capability-2

# After (v2.1)
capabilities:
  core:
    - analyze
    - test
  specialized:
    - domain-capability-1
    - domain-capability-2
  experimental: []
```

3. **Convert tools to three-category structure**:
```yaml
# Before (v1.0)
tools:
  - fs
  - bruno-supabase
  - optional-tool

# After (v2.1)
tools:
  required:
    - fs
    - bruno-supabase
  optional:
    - optional-tool
  mcp_servers:
    - bruno-supabase
    - fs
```

4. **Add constitutional compliance**:
```yaml
constitutional_compliance:
  article_i_spec_authority: true
  article_iii_test_first: true
  article_iv_incremental: true
  article_v_independent_test: true
  article_vi_evidence_based: true
```

5. **Add task routing**:
```yaml
task_routing:
  priority_levels:
    - P1
    - P2
    - P3
  default_priority: P1
  escalation_threshold: 0.8
```

6. **Add quality metrics**:
```yaml
quality_metrics:
  validation_score: 0.95
  test_coverage: 0.95
  spec_compliance: 0.99
  performance_rating: 0.90
```

7. **Add acceptance criteria**:
```yaml
acceptance_criteria:
  format: given-when-then
  test_scenarios:
    - given: Agent {name} is initialized
      when: Core capability is invoked
      then: Operation completes successfully with expected output
      priority: P1
  evidence_requirements:
    - test-results
    - coverage-report
    - validation-score
```

#### Post-Migration Validation

After migration, validate the agent:

```bash
python3 scripts/validate-agents-v2.1.py agents/migrated-agent.yaml --verbose
```

Expected output:
```
✅ migrated-agent (2.1.0)

SCHEMA v2.1 VALIDATION SUMMARY
Total Agents:     1
Valid:            1 ✅
Invalid:          0 ❌
Validation Rate:  100.0%
```

---

## Validation Guide

### Running Validation

#### Validate Single Agent

```bash
python3 scripts/validate-agents-v2.1.py agents/agent-name.yaml --verbose
```

#### Validate All Agents

```bash
python3 scripts/validate-agents-v2.1.py agents/ --verbose
```

#### Generate JSON Report

```bash
python3 scripts/validate-agents-v2.1.py agents/ --report reports/validation-report.json
```

### Validation Output

**Console Output**:
```
🔍 Validating 37 agent files from agents

✅ design-system-architect (2.1.0)
✅ e2e-test-engineer (2.1.0)
❌ invalid-agent (2.1.0)
  ❌ Missing required field: tools.mcp_servers
  ⚠️  Description is too short (< 20 characters)

======================================================================
SCHEMA v2.1 VALIDATION SUMMARY
======================================================================
Total Agents:     37
Valid:            36 ✅
Invalid:          1 ❌
Validation Rate:  97.3%
Avg Quality:      0.930

Constitutional Compliance:
  ✅ article_i_spec_authority: 36/37 (97.3%)
  ✅ article_iii_test_first: 36/37 (97.3%)
  ✅ article_iv_incremental: 36/37 (97.3%)
  ✅ article_v_independent_test: 36/37 (97.3%)
  ✅ article_vi_evidence_based: 36/37 (97.3%)
======================================================================
```

**JSON Report Structure**:
```json
{
  "summary": {
    "total_agents": 37,
    "valid": 36,
    "invalid": 1,
    "validation_rate": 97.3,
    "avg_quality_score": 0.93
  },
  "quality_metrics": {
    "averages": {
      "validation_score": 0.948,
      "test_coverage": 0.925,
      "spec_compliance": 0.965,
      "performance_rating": 0.891
    }
  },
  "constitutional_compliance": {
    "article_i_spec_authority": {
      "compliant": 36,
      "non_compliant": 1,
      "percentage": 97.3
    }
  },
  "valid_agents": [...],
  "invalid_agents": [...]
}
```

### Common Validation Errors

#### Missing Required Field

**Error**: `Missing required field: tools.mcp_servers`

**Fix**: Add the missing field:
```yaml
tools:
  required: [...]
  optional: [...]
  mcp_servers: [bruno-supabase, fs]  # Add this
```

#### Invalid Type

**Error**: `Invalid type for agent type: expected string, got list`

**Fix**: Ensure field is correct type:
```yaml
# Wrong
type: [traditional]

# Correct
type: traditional
```

#### Invalid Value

**Error**: `Invalid agent type: custom. Must be one of [specialist, traditional, edge_function, orchestrator]`

**Fix**: Use allowed enum value:
```yaml
# Wrong
type: custom

# Correct
type: traditional
```

#### Invalid Version

**Error**: `Invalid schema version: 1.0.0. Must be 2.1.x`

**Fix**: Update version to 2.1.0:
```yaml
# Wrong
version: "1.0.0"

# Correct
version: "2.1.0"
```

#### Description Too Short

**Warning**: `Description is too short (< 20 characters)`

**Fix**: Expand description:
```yaml
# Wrong
description: "Test agent"

# Correct
description: "End-to-end testing specialist using Playwright for browser automation"
```

---

## Orchestration Guide

### Multi-Agent Coordination

#### Wave-Based Orchestration

The framework supports coordinated multi-agent operations through a 5-wave system:

```python
from superclaude_designer import Orchestrator

orchestrator = Orchestrator()

# Execute 5-wave operation
result = orchestrator.execute_waves(
    operation="comprehensive-analysis",
    agents=[
        "design-system-architect",
        "accessibility-specialist",
        "e2e-test-engineer"
    ],
    waves=5,
    parallel_workers=4
)
```

**Wave Execution**:
1. **Wave 1 - Discovery**: All agents analyze and gather context
2. **Wave 2 - Design**: Agents collaborate on design decisions
3. **Wave 3 - Implementation**: Parallel implementation across agents
4. **Wave 4 - Validation**: Quality validation and testing
5. **Wave 5 - Documentation**: Generate comprehensive documentation

#### Priority-Based Routing

Agents support P1/P2/P3 priority routing:

```python
# Route task to appropriate agents based on priority
result = orchestrator.route_task(
    task="Implement authentication system",
    priority="P1",  # MVP critical
    agents=["backend-architect", "security-engineer"]
)
```

**Priority Levels**:
- **P1 (MVP Critical)**: Serial execution, 80% resources, 100% test coverage
- **P2 (Enhancements)**: Parallel execution, 60% resources, 95% test coverage
- **P3 (Nice-to-Have)**: Opportunistic execution, 20% resources, 80% test coverage

#### Escalation Handling

Agents automatically escalate complex tasks:

```python
# Agent evaluates complexity and escalates if needed
task_complexity = agent.evaluate_complexity(task)

if task_complexity > agent.escalation_threshold:
    # Escalate to higher priority or request additional agents
    result = orchestrator.escalate(
        task=task,
        current_priority="P2",
        new_priority="P1",
        reason="Complexity exceeds threshold"
    )
```

### Parallel Execution

#### Multi-Agent Parallel Processing

```python
from concurrent.futures import ThreadPoolExecutor

# Execute agents in parallel
with ThreadPoolExecutor(max_workers=4) as executor:
    futures = {
        executor.submit(agent.execute, task): agent
        for agent in selected_agents
    }

    results = []
    for future in concurrent.futures.as_completed(futures):
        agent = futures[future]
        result = future.result()
        results.append(result)
```

#### Domain-Specific Agent Groups

Group agents by domain for coordinated operations:

```python
design_agents = [
    "design-system-architect",
    "design-token-manager",
    "ui-animation-engineer",
    "responsive-design-engineer",
    "accessibility-specialist"
]

performance_agents = [
    "core-web-vitals-optimizer",
    "bundle-size-analyzer",
    "performance-profiler",
    "lighthouse-auditor"
]

testing_agents = [
    "e2e-test-engineer",
    "visual-regression-tester",
    "accessibility-tester",
    "performance-test-engineer"
]

# Execute domain-specific operation
result = orchestrator.execute_group(
    agents=design_agents,
    operation="design-system-audit"
)
```

### MCP Server Integration

#### Bruno Supabase Integration

```python
# Agent with Supabase integration
agent = orchestrator.get_agent("database-architect")

# Execute Supabase operation
result = agent.execute(
    operation="create-migration",
    mcp_server="bruno-supabase",
    params={
        "table": "users",
        "migration_type": "create"
    }
)
```

#### Playwright Integration

```python
# Agent with Playwright integration
agent = orchestrator.get_agent("e2e-test-engineer")

# Execute E2E test
result = agent.execute(
    operation="run-e2e-tests",
    mcp_server="playwright",
    params={
        "browsers": ["chromium", "firefox", "webkit"],
        "test_suite": "critical-paths"
    }
)
```

---

## Best Practices

### Agent Design

1. **Single Responsibility**: Each agent should have one clear purpose
2. **Minimal Core Capabilities**: Include only essential core capabilities (3-5)
3. **Descriptive Specialized Capabilities**: Use clear, hyphenated names
4. **Minimal Required Tools**: Only include absolutely necessary tools
5. **Conservative Escalation**: Use `0.8` threshold for most agents

### Quality Standards

1. **High Test Coverage**: Target 95%+ for critical agents, 80%+ minimum
2. **Spec Compliance**: Maintain 90%+ compliance with specifications
3. **Performance Monitoring**: Track and optimize performance ratings
4. **Evidence-Based Validation**: Require verifiable evidence for all claims

### Constitutional Compliance

1. **Spec Authority**: Always follow spec-driven development methodology
2. **Test First**: Write tests before implementation
3. **Incremental Delivery**: Implement P1 features before P2/P3
4. **Independent Testing**: Ensure features are independently testable
5. **Evidence Based**: Require verifiable evidence for all claims

### Migration

1. **Use Automated Script**: Leverage `migrate-agents-v2.1.py` for consistency
2. **Validate After Migration**: Always run validation after migration
3. **Preserve Legacy**: Keep v1.0 agents in `migrated/` directory for reference
4. **Test Thoroughly**: Ensure migrated agents function correctly

### Validation

1. **Validate Early**: Run validation during development, not just at end
2. **Fix Errors Immediately**: Don't let validation errors accumulate
3. **Monitor Quality Metrics**: Track quality scores over time
4. **Generate Reports**: Use JSON reports for tracking and analysis

### Orchestration

1. **Use Priority Routing**: Leverage P1/P2/P3 for task management
2. **Enable Parallel Execution**: Use multiple workers for performance
3. **Monitor Escalations**: Track and analyze escalation patterns
4. **Coordinate by Domain**: Group agents by domain for efficiency

---

## Troubleshooting

### Validation Failures

#### Problem: Agent fails validation with "Missing required field"

**Cause**: Required field is missing from YAML

**Solution**: Add the missing field according to schema specification
```bash
# Check schema documentation for required field
# Add field to agent YAML
# Re-run validation
python3 scripts/validate-agents-v2.1.py agents/agent-name.yaml --verbose
```

#### Problem: Quality score below target

**Cause**: One or more quality metrics below threshold

**Solution**: Improve specific metrics
```yaml
# Check which metric is low
quality_metrics:
  validation_score: 0.85  # Low
  test_coverage: 0.90     # Check test coverage
  spec_compliance: 0.95   # OK
  performance_rating: 0.75  # Low - improve performance
```

### Migration Issues

#### Problem: Migration script fails

**Cause**: Invalid v1.0 YAML structure

**Solution**: Fix v1.0 YAML before migration
```bash
# Validate v1.0 YAML syntax
python3 -c "import yaml; yaml.safe_load(open('agents/agent.yaml'))"

# Fix any syntax errors
# Re-run migration
```

#### Problem: Migrated agent has incorrect capabilities

**Cause**: Capability classification failed

**Solution**: Manually adjust capabilities
```yaml
# Review and adjust capability categorization
capabilities:
  core:
    - analyze  # Core capability
    - test     # Core capability
  specialized:
    - domain-specific-capability  # Move from core if needed
```

### Orchestration Issues

#### Problem: Parallel execution fails

**Cause**: Thread pool configuration or agent conflicts

**Solution**: Adjust thread pool configuration
```python
# Reduce max_workers if resource constrained
with ThreadPoolExecutor(max_workers=2) as executor:
    # Execute agents
```

#### Problem: Task escalation not working

**Cause**: Escalation threshold too high or complexity calculation incorrect

**Solution**: Adjust escalation threshold
```yaml
task_routing:
  escalation_threshold: 0.7  # Lower threshold for more aggressive escalation
```

---

## Reference

### File Locations

```
superclaude-designer/
├── agents/                           # Production agents (Schema v2.1)
│   ├── design-system-architect.yaml
│   ├── e2e-test-engineer.yaml
│   └── ... (37 total)
├── schemas/                          # Schema specifications
│   ├── agent-schema-v2.1.yaml
│   ├── capability-taxonomy-v2.1.yaml
│   ├── validation-scoring-methodology-v2.1.yaml
│   └── priority-routing-system-v2.1.yaml
├── scripts/                          # Automation scripts
│   ├── migrate-agents-v2.1.py
│   └── validate-agents-v2.1.py
├── reports/                          # Generated reports
│   ├── WAVE1_DISCOVERY_SYNTHESIS.md
│   ├── WAVE4_ORCHESTRATION_POWER_ANALYSIS.md
│   ├── WAVE4_QUALITY_METRICS_REPORT.md
│   └── validation-report-v2.1.json
├── docs/                             # Documentation
│   └── FRAMEWORK_DOCUMENTATION.md
└── migrated/                         # Legacy v1.0 agents (62 agents)
```

### Key Metrics

```yaml
Framework Version: 2.1.0
Production Agents: 37
Legacy Agents: 62 (preserved)
Orchestration Power: 1446x
Quality Score: 93.0% average
Constitutional Compliance: 100%
Validation Rate: 100%
```

### Command Reference

```bash
# Validate single agent
python3 scripts/validate-agents-v2.1.py agents/agent-name.yaml --verbose

# Validate all agents
python3 scripts/validate-agents-v2.1.py agents/ --verbose --report reports/validation.json

# Migrate single agent
python3 scripts/migrate-agents-v2.1.py agents/agent-name.yaml --output agents/agent-name.yaml

# Migrate all agents
for file in agents/*.yaml; do
  python3 scripts/migrate-agents-v2.1.py "$file" --output "$file"
done
```

### Quality Standards

```yaml
Excellent:  95%+ quality score
Good:       90-95% quality score
Acceptable: 85-90% quality score
Poor:       <85% quality score

Target Quality Metrics:
- validation_score: 0.95+ (95%+)
- test_coverage: 0.80+ (80%+)
- spec_compliance: 0.90+ (90%+)
- performance_rating: 0.80+ (80%+)
```

### Links

- **Spec-Kit Repository**: https://github.com/github/spec-kit.git
- **Claude Code Templates**: https://github.com/davila7/claude-code-templates.git
- **SuperClaude Designer**: /Users/tbwa/superclaude-designer

---

**End of Documentation**
