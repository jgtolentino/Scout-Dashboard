# CLI Command Routing Standard Operating Procedure

**Version:** 1.1  
**Last Updated:** 2025-05-16  
**Author:** InsightPulseAI  
**Approved By:** System Admin Team

# PATCH: enforcement-language-hardening-v1
# The following changes have been made to enforce stricter language requirements:
# - Changed instances of "should" to "MUST" where appropriate
# - Replaced "recommended" with explicit requirements
# - Added enforcement mechanisms for critical requirements
# End of patch header

## 1. Purpose

This Standard Operating Procedure (SOP) defines the process for creating, modifying, and managing command-line interface (CLI) commands and routing logic within the InsightPulseAI system. It ensures consistent command behavior, proper agent routing, and reliable fallback mechanisms.

## 2. Scope

This SOP applies to:
- Pulser CLI commands
- Claude CLI integration
- Command aliases and shortcuts
- Routing configurations
- Fallback logic
- Command documentation

## 3. Responsibilities

| Role | Responsibilities |
|------|-----------------|
| CLI Engineer | Designs and implements CLI commands and routing |
| Agent Developer | Implements agent-specific command handlers |
| QA Engineer | Validates command functionality and reliability |
| System Admin | Approves production commands, manages routing tables |
| End User | Follows command usage guidelines |

## 4. CLI Command Structure

### 4.1 Command Format

All CLI commands MUST follow the format:

```
[command_name] [subcommand] [--flag1 value1] [--flag2 value2] [positional_arg]
```

Example:
```bash
pulser prompt_engineer analyze --prompt "Generate a dashboard" --output analysis.json
```

### 4.2 Command Naming Convention

- **Main commands**: Lowercase with underscores (e.g., `prompt_engineer`)
- **Subcommands**: Lowercase with underscores (e.g., `analyze`)
- **Flags**: Lowercase with hyphens (e.g., `--output-format`)
- **Aliases**: Prefixed with colon (e.g., `:prompt`)

## 5. Command Definition Procedure

### 5.1 Creating New Commands

1. Define command in `.pulserrc` configuration:
   ```yaml
   commands:
     new_command:
       description: "Command description"
       handler: "path/to/handler.js"
       aliases: [":nc", ":newcmd"]
   ```

2. Create command handler file
3. Implement command logic
4. Create command documentation
5. Test command functionality
6. Submit for review

### 5.2 Command Documentation

Every command MUST include:
- Purpose and description
- Usage examples
- Parameter descriptions
- Expected output
- Error handling
- Related commands

### 5.3 Command Versioning

- Commands follow semantic versioning (MAJOR.MINOR.PATCH)
- Breaking changes require a major version increment
- Command history is maintained in command registry

## 6. Command Routing Configuration

### 6.1 Routing Definition

Define routing in agent routing YAML files:

```yaml
routes:
  - pattern: "analyze prompt"
    agent: prompt_engineer
    handler: analyze_prompt
    priority: high
    
  - pattern: "generate dashboard"
    agent: dash
    handler: generate_dashboard
    priority: medium
```

### 6.2 Pattern Matching

- Support for regex patterns
- Keyword matching
- Intent classification
- Context-aware routing

### 6.3 Route Priorities

1. **Very High**: Critical system functions
2. **High**: Time-sensitive operations
3. **Medium**: Standard operations
4. **Low**: Background or convenience operations

## 7. Fallback Logic

### 7.1 Fallback Cascades

Define fallback cascades for each route:

```yaml
fallback_cascades:
  prompt_engineering:
    sequence:
      - agent: prompt_engineer
        mode: simplified
      - agent: claude
        mode: standard
      - agent: claudia
        mode: orchestration
```

### 7.2 Fallback Triggers

Fallbacks are triggered by:
- Command execution errors
- Timeout exceeded
- Permission denied
- Resource unavailable
- Invalid output format

### 7.3 Recovery Strategies

1. **Retry** - Attempt command again with same parameters
2. **Simplify** - Retry with simplified parameters
3. **Alternate** - Try alternate command path
4. **Escalate** - Hand off to supervising agent
5. **Notify** - Inform user of failure and suggest alternatives

## 8. Command Testing Protocol

### 8.1 Test Requirements

All commands MUST be tested for:
- Correct routing
- Parameter validation
- Proper execution
- Error handling
- Fallback behavior
- Performance

### 8.2 Testing Commands

```bash
# Test command routing
pulser test-route "example command text"

# Test command execution
pulser test-command command_name --params param1=value1

# Test fallback behavior
pulser test-fallback command_name --trigger-error
```

### 8.3 Testing Documentation

Document test results in command test logs including:
- Command tested
- Parameters used
- Expected vs. actual routing
- Execution success/failure
- Fallback behavior
- Performance metrics

## 9. Deployment Procedure

### 9.1 Deployment Requirements

Before deployment, commands MUST have:
- Passed all test cases
- Documentation completed
- Routing configured
- Fallbacks defined
- QA signoff

### 9.2 Deployment Process

1. Add command to routing configuration
2. Deploy handler implementation
3. Update command documentation
4. Verify command availability
5. Monitor initial usage

### 9.3 Rollback Procedure

In case of issues:
1. Temporarily disable command
2. Restore previous routing configuration
3. Document issues
4. Fix and redeploy

## 10. Command Monitoring

### 10.1 Metrics Collection

Track the following metrics:
- Command usage frequency
- Average execution time
- Success/failure rate
- Fallback frequency
- Error types
- User satisfaction ratings

### 10.2 Continuous Improvement

1. Analyze command usage patterns
2. Identify commonly failing commands
3. Optimize routing for frequent commands
4. Simplify complex command workflows
5. Document common usage patterns

## 11. Related Documents

- [Prompt Engineering Guide](../PROMPT_ENGINEERING.md)
- [Agent Behavior Documentation](../agent_behavior.md)
- [CLI User Manual](../cli_user_manual.md)
- [Troubleshooting Guide](../troubleshooting.md)

## 12. Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1 | 2025-05-16 | Applied enforcement-language-hardening-v1 | Claude 3.7 Sonnet |
| 1.0 | 2025-05-15 | Initial SOP | InsightPulseAI |