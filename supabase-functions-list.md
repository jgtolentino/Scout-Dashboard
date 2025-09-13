# Supabase Edge Functions Inventory for TBWA DataBank

## Project: InsightPulseAI (cxzllzyxwpyptfretryc)

### Complete Edge Functions List (24 Functions)

#### 1. AI & Bot Functions
1. **aladdin** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/aladdin`
   - Last updated: 10 days ago
   - Deployments: 6

2. **retailbot** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/retailbot`
   - Last updated: 10 days ago
   - Deployments: 3

3. **adsbot** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/adsbot`
   - Last updated: 10 days ago
   - Deployments: 3

4. **suqi-bot** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/suqi-bot`
   - Last updated: 4 days ago
   - Deployments: 3

5. **sari-sari-expert** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/sari-sari-expert`
   - Last updated: 3 days ago
   - Deployments: 3

6. **enhanced-sari-sari-expert** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/enhanced-sari-sari-expert`
   - Last updated: 3 days ago
   - Deployments: 3

#### 2. Utility Functions
7. **sql-certifier** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/sql-certifier`
   - Last updated: 10 days ago
   - Deployments: 3

8. **ai-categorize** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/ai-categorize`
   - Last updated: 5 days ago
   - Deployments: 2

9. **ocr-parser** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/ocr-parser`
   - Last updated: 5 days ago
   - Deployments: 2

10. **parse-files** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/parse-files`
    - Last updated: 5 days ago
    - Deployments: 3

11. **municipalities-geojson** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/municipalities-geojson`
    - Last updated: 4 days ago
    - Deployments: 20

#### 3. Schema Sync Functions (NEW)
12. **toolsync-agent** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/toolsync-agent`
    - Last updated: 12 minutes ago
    - Deployments: 2
    - Purpose: Schema introspection and tool generation

13. **toolsync-cron** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/toolsync-cron`
    - Last updated: 4 minutes ago
    - Deployments: 1
    - Purpose: Scheduled schema synchronization

14. **toolsync-analyzer** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/toolsync-analyzer`
    - Last updated: 4 minutes ago
    - Deployments: 1
    - Purpose: AI-powered schema drift analysis

#### 4. Make.com Integration Functions
15. **make-server-bc5932cb** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/make-server-bc5932cb`
    - Last updated: 7 days ago
    - Deployments: 28

16. **make-server-fa8c3d86** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/make-server-fa8c3d86`
    - Last updated: 9 days ago
    - Deployments: 2

17. **make-server-c6022503** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/make-server-c6022503`
    - Last updated: 9 days ago
    - Deployments: 2

18. **make-server-e0a3193f** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/make-server-e0a3193f`
    - Last updated: 8 days ago
    - Deployments: 12

19. **make-server-012fcae1** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/make-server-012fcae1`
    - Last updated: 5 days ago
    - Deployments: 3

20. **make-server-58a5def4** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/make-server-58a5def4`
    - Last updated: 3 days ago
    - Deployments: 27

21. **make-server-a0c249c2** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/make-server-a0c249c2`
    - Last updated: 3 days ago
    - Deployments: 20

22. **make-server-d9a2b5fe** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/make-server-d9a2b5fe`
    - Last updated: 3 days ago
    - Deployments: 10

23. **make-server-305bfaf3** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/make-server-305bfaf3`
    - Last updated: 3 days ago
    - Deployments: 6

24. **make-server-5cb509f9** - `https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/make-server-5cb509f9`
    - Last updated: 21 hours ago
    - Deployments: 3

## Function Categories Summary

### By Purpose:
- **AI/Bot Services**: 6 functions (aladdin, retailbot, adsbot, suqi-bot, sari-sari-expert variants)
- **Data Processing**: 4 functions (sql-certifier, ai-categorize, ocr-parser, parse-files)
- **Schema Management**: 3 functions (toolsync-agent, toolsync-cron, toolsync-analyzer)
- **Make.com Integrations**: 10 functions (various make-server-* functions)
- **Geographic Data**: 1 function (municipalities-geojson)

### By Activity (Last Week):
- **Most Active**: make-server-58a5def4 (27 deployments)
- **Recently Created**: toolsync functions (created today)
- **Stable Functions**: AI bots (last updated 10 days ago)

## Usage Examples

### Calling Edge Functions
```bash
# Example: Call the toolsync-agent
curl -X POST https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/toolsync-agent \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"command": "scan", "schema": "public"}'

# Example: Call the ai-categorize function
curl -X POST https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/ai-categorize \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Sample text to categorize"}'
```

### From JavaScript/TypeScript
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Call an edge function
const { data, error } = await supabase.functions.invoke('toolsync-agent', {
  body: { command: 'scan', schema: 'public' }
})
```

## Deployment Commands

### Download Functions Locally
```bash
# Download specific functions
supabase functions download toolsync-analyzer
supabase functions download toolsync-cron
supabase functions download aladdin
supabase functions download retailbot

# Deploy a function
supabase functions deploy function-name

# View logs
supabase functions logs function-name
```

## Integration with MCP

These Edge Functions can be integrated with the MCP (Model Context Protocol) for Claude integration. See the updated CLAUDE.md for configuration details.