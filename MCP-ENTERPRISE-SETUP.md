# TBWA Enterprise MCP Setup Documentation

## Complete Role-Based Dashboards & AI Agents Configuration

### Overview
This document contains the complete MCP (Model Context Protocol) configuration for TBWA's enterprise platform with role-based dashboards and AI agents.

### Current MCP Servers (Active)

1. **tbwa_hr_intelligence** - HR Manager Dashboard
2. **tbwa_finance_operations** - Finance Manager Dashboard  
3. **tbwa_executive_dashboard** - Executive Full Access
4. **tbwa_scout_dashboard** - Cross-Domain Analytics

### Complete Configuration

Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

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
        "SUPABASE_ACCESS_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleHh3bWxyb2VmZGlzZ3hwc3pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0MDcyNCwiZXhwIjoyMDY4NDE2NzI0fQ.rPkW7VgW42GCaz9cfxvhyDo_1ySHBiyxnjfiycJXptc"
      }
    },
    "tbwa_hr_intelligence": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_PROJECT_REF": "cxzllzyxwpyptfretryc",
        "SUPABASE_ACCESS_TOKEN": "sbp_c4c5fa81cc1fde770145ace4e79a33572748b25f",
        "SUPABASE_ROLE": "hr_manager",
        "ALLOWED_SCHEMAS": "hris,onboarding,analytics",
        "USER_CONTEXT": "hr_manager"
      }
    },
    "tbwa_finance_operations": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_PROJECT_REF": "cxzllzyxwpyptfretryc",
        "SUPABASE_ACCESS_TOKEN": "sbp_c4c5fa81cc1fde770145ace4e79a33572748b25f",
        "SUPABASE_ROLE": "finance_manager",
        "ALLOWED_SCHEMAS": "expense,approval,audit",
        "USER_CONTEXT": "finance_manager"
      }
    },
    "tbwa_executive_dashboard": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_PROJECT_REF": "cxzllzyxwpyptfretryc",
        "SUPABASE_ACCESS_TOKEN": "sbp_c4c5fa81cc1fde770145ace4e79a33572748b25f",
        "SUPABASE_ROLE": "executive",
        "ALLOWED_SCHEMAS": "hris,expense,service_desk,approval,office_ops,audit,analytics,onboarding,agentic,knowledge,security,integration",
        "USER_CONTEXT": "executive"
      }
    },
    "tbwa_scout_dashboard": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_PROJECT_REF": "cxzllzyxwpyptfretryc",
        "SUPABASE_ACCESS_TOKEN": "sbp_c4c5fa81cc1fde770145ace4e79a33572748b25f",
        "SUPABASE_ROLE": "scout_analyst",
        "ALLOWED_SCHEMAS": "hris,expense,service_desk,operations,corporate,creative_insights,analytics",
        "USER_CONTEXT": "scout_dashboard",
        "ANALYTICS_MODE": "advanced",
        "CROSS_DOMAIN": "true"
      }
    }
  }
}
```

### Platform Components

#### 1. Role-Based Dashboards
- **HR Dashboard** (`/dashboard/hr`) - Employee management, performance tracking
- **Finance Dashboard** (`/dashboard/finance`) - Expense management, budget tracking
- **Executive Dashboard** (`/dashboard/executive`) - Full enterprise overview
- **Scout Analytics** (`/dashboard/scout`) - Cross-domain business intelligence

#### 2. AI Agent Edge Functions
- **hr-assistant** - Claude-powered HR support
- **expense-classifier** - OpenAI expense categorization
- **document-processor** - LlamaIndex document analysis
- **ticket-router** - Malla intelligent routing
- **knowledge-assistant** - Arkis RAG queries
- **workflow-automation** - Jasion process automation
- **sentiment-analyzer** - YiYi sentiment analysis

#### 3. Database Architecture
- 14 specialized schemas
- Role-based Row Level Security (RLS)
- Multi-tenant architecture
- Real-time synchronization

### Testing Your Setup

#### 1. Verify MCP Servers
After restarting Claude Desktop, all servers should show "running" status.

#### 2. Test Commands

```bash
# Test HR Intelligence
Using tbwa_hr_intelligence, what HR data can I access?

# Test Finance Operations  
Using tbwa_finance_operations, show me expense management capabilities

# Test Executive Dashboard
Using tbwa_executive_dashboard, list all enterprise schemas

# Test Scout Analytics
Using tbwa_scout_dashboard, provide cross-domain business intelligence
```

#### 3. Run Comprehensive Test
```bash
./test-all-systems.sh
```

### Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc
- **SQL Editor**: https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/sql/new
- **Edge Functions**: https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/functions
- **API Endpoint**: https://cxzllzyxwpyptfretryc.supabase.co

### Deployment Status

✅ **MCP Servers**: All 4 configured with correct service role key  
✅ **AI Agents**: 7 edge functions deployed  
✅ **Database**: Role-based access enabled  
✅ **Test Results**: 89% success rate (8/9 tests passed)

### Created Files

1. `unified_platform.sql` - Complete database schema
2. `edge-functions/` - AI agent implementations
3. `deployment_manifest.json` - Full deployment details
4. `test-results.json` - Latest test results
5. `CLAUDE.md` - Updated with MCP documentation

### Troubleshooting

If MCP servers show authentication errors:
1. Get latest service role key from Supabase dashboard
2. Update all TBWA server configurations
3. Restart Claude Desktop

---

*Last Updated: 2025-07-19*
*Platform Version: 1.0.0*
*MCP Servers: 6 total (4 TBWA + 2 base)*