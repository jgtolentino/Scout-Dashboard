# SuperClaude Designer - Security Policy

## Zero-Credential Policy
- Bruno injects secrets via keychain references
- Agents never see raw keys or credentials
- All MCP servers use Bruno proxy for authentication

## Filesystem MCP
- Scope limited to repository root only
- Deny access to parent directories and system paths
- Read/write operations logged for audit

## Supabase MCP
- Read-only access via Bruno proxy by default
- Write operations require explicit approval
- Service role key stored in macOS Keychain

## Network Security
- No direct tunnels without protection
- Access control via Cloudflare Access
- IP allowlist enforcement
- Short-lived tokens (max 1 hour TTL)

## Agent Permissions
- Default: read_only for all agents
- Explicit grants for write operations
- MCP server allowlists per agent
- Command execution validation gates
