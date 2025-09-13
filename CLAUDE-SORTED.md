# CLAUDE.md - TBWA Enterprise Data Platform Configuration (SORTED)

## Table of Contents
1. [Enterprise Context](#enterprise-context)
2. [Critical Verification Requirements](#critical-verification-requirements)
3. [Enterprise MCP Architecture](#enterprise-mcp-architecture)
4. [Multi-Project Configuration](#multi-project-configuration)
5. [Database Schema Architecture](#database-schema-architecture)
6. [Development Standards](#development-standards)
7. [Testing Requirements](#testing-requirements)
8. [Security Guidelines](#security-guidelines)
9. [Deployment Procedures](#deployment-procedures)
10. [Agent Registry](#agent-registry)

---

## 1. Enterprise Context

**TBWA Enterprise Data Platform** - Unified data platform serving:
- Scout Dashboard
- HR Admin
- Finance Ops
- Operations Hub
- Corporate Portal
- Creative Insights

### Projects Overview
- **Primary Project**: `cxzllzyxwpyptfretryc` (HR/Finance Operations)
- **Alternate Project**: `texxwmlroefdisgxpszc` (Agent Registry)

---

## 2. Critical Verification Requirements

### NEVER Claim Success Without Evidence

**MANDATORY VERIFICATION PROTOCOL**:
1. **Console Check**: Zero errors in browser console (F12)
2. **Screenshot Proof**: Actual deployed app or preview screenshots
3. **Automated Testing**: Use headless browser testing
4. **Evidence-Based Reporting**: Only claim success with proof

### Verification Response Format

✅ **ALWAYS DO THIS**:
```
"I've successfully deployed the application. Here's the verification:
1. Console: ✅ No errors (screenshot attached)
2. Network: ✅ All API calls successful (200 status)
3. UI: ✅ Data rendering correctly
4. Tests: ✅ All 47 tests passing
[Screenshot: deployed-app-verification.png]"
```

❌ **NEVER DO THIS**:
```
"The app is deployed and working perfectly!"
"Everything should be working now."
"I've set everything up correctly."
```

---

## 3. Enterprise MCP Architecture

### Current Active MCP Servers

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/Users/tbwa/Library/Application Support/Claude/Claude Extensions/ant.dir.ant.anthropic.filesystem.disabled/server/index.js"],
      "env": {}
    },
    "supabase_primary": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=cxzllzyxwpyptfretryc"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_c4c5fa81cc1fde770145ace4e79a33572748b25f"
      }
    },
    "supabase_alternate": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=texxwmlroefdisgxpszc"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    },
    "supa-pulser": {
      "command": "node",
      "args": ["/Users/tbwa/hris-fs-ai-central-hub/backend/mcp-servers/supa-pulser/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://cxzllzyxwpyptfretryc.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

### MCP Server Status
- **Status**: ⚠️ NOT AVAILABLE IN CURRENT SESSION
- **Projects Configured**: 
  - Primary: cxzllzyxwpyptfretryc
  - Alternate: texxwmlroefdisgxpszc (Agent Registry)
- **Configuration**: ~/.claude/claude_desktop_config.json

---

## 4. Multi-Project Configuration

### Environment Variables

```bash
# Primary Project (HR/Finance)
PRIMARY_PROJECT_REF="cxzllzyxwpyptfretryc"
PRIMARY_SUPABASE_URL="https://cxzllzyxwpyptfretryc.supabase.co"
PRIMARY_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
PRIMARY_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Alternate Project (Agent Registry)
ALTERNATE_PROJECT_REF="texxwmlroefdisgxpszc"
ALTERNATE_SUPABASE_URL="https://texxwmlroefdisgxpszc.supabase.co"
ALTERNATE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
ALTERNATE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Multi-Project CLI (sb-multi-enhanced)

```bash
# Project Management
sb-multi switch [primary|alternate]     # Switch active project
sb-multi access [anon|service]         # Switch access level
sb-multi status                        # Show current configuration

# Database Operations
sb-multi sql 'SELECT 1'                # Execute SQL
sb-multi test                          # Test current connection
sb-multi create-schema <name>          # Create schema
sb-multi list-tables [schema]          # List tables

# Testing
sb-multi both                          # Test both projects
sb-multi all-tokens                    # Test all 4 token combinations

# Agent Registry
sb-multi agent-registry create         # Create agent registry
sb-multi agent-registry list           # List agents
sb-multi agent-registry health         # Agent health dashboard
```

---

## 5. Database Schema Architecture

### HR/Admin Domain
```sql
CREATE SCHEMA hr_admin;

-- Core employee data
CREATE TABLE hr_admin.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department_id UUID REFERENCES hr_admin.departments(id),
  position_id UUID REFERENCES hr_admin.positions(id),
  hire_date DATE NOT NULL,
  status employee_status DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Finance Domain
```sql
CREATE SCHEMA financial_ops;

-- Account management
CREATE TABLE financial_ops.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  account_type account_type_enum,
  parent_account_id UUID REFERENCES financial_ops.accounts(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Agent Registry Domain
```sql
CREATE SCHEMA agent_registry;

-- Agents table
CREATE TABLE agent_registry.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  type agent_type NOT NULL,
  status agent_status DEFAULT 'inactive',
  version TEXT NOT NULL,
  configuration JSONB DEFAULT '{}',
  capabilities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ
);
```

---

## 6. Development Standards

### Code Style Guidelines
- **DRY (Don't Repeat Yourself)**: Reuse existing components and utilities
- **KISS (Keep It Simple)**: Prefer simple, readable solutions
- **Type Safety**: Use TypeScript types and interfaces
- **Error Handling**: Always handle errors gracefully

### Naming Conventions
- **Variables/Functions**: camelCase (`getUserData`, `isLoading`)
- **Components**: PascalCase (`ScoutDashboard`, `DataViewer`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `API_ENDPOINT`)
- **Files**: kebab-case (`scout-dashboard.tsx`)

### Git Commit Messages
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

---

## 7. Testing Requirements

### Unit Testing
- Write tests for new utilities and functions
- Include edge cases and error scenarios
- Maintain >80% code coverage

### Integration Testing
- Test API endpoints with various inputs
- Verify database operations
- Test authentication flows

### E2E Testing
- Use Playwright for cross-browser testing
- Test critical user journeys
- Verify responsive design

---

## 8. Security Guidelines

### Data Protection
- Never commit sensitive data or API keys
- Use environment variables for configuration
- Implement Row Level Security (RLS)
- Encrypt sensitive data at rest

### Authentication
- Use Supabase Auth for user management
- Implement MFA where appropriate
- Regular security audits

### API Security
- Validate all inputs
- Implement rate limiting
- Use HTTPS everywhere
- CORS configuration

---

## 9. Deployment Procedures

### Pre-deployment Checklist
1. All tests passing
2. Code review completed
3. Documentation updated
4. Environment variables configured
5. Database migrations ready

### Deployment Steps
```bash
# 1. Run tests
npm test

# 2. Build applications
npm run build

# 3. Deploy to Supabase
supabase db push
supabase functions deploy

# 4. Verify deployment
npm run verify:production
```

---

## 10. Agent Registry

### Production Agents
- **Master-Toggle**: Orchestration and routing
- **Lyra-Primary/Secondary**: NLP and analysis (HA pair)
- **ToggleBot**: Integration connector
- **Iska**: Analytics and reporting
- **YaYo Aguila**: UX/IO operations

### Agent Management
```bash
# Deploy agents
./deploy-agent.sh Master-Toggle

# Monitor health
curl http://localhost:3030/mcp/agents

# View logs
sb-multi agent-registry health
```

---

## Important Notes

### NEVER Copy-Paste SQL
- Use MCP tools for direct execution
- Use sb-multi CLI for database operations
- Use Supabase Dashboard only when necessary

### Always Verify
- Check console for errors
- Take screenshots of deployed features
- Run automated tests
- Document verification results

### Current Workaround
Until MCP tools are available:
1. SQL files are created locally
2. Use Supabase Dashboard SQL Editor
3. Or use sb-multi CLI wrapper

---

**Last Updated**: 2025-07-20
**Repository**: https://github.com/jgtolentino/hris-fs-ai-central-hub