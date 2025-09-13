# 🎯 TBWA Product Matrix - Master Reference

## 📊 Complete Product Portfolio (Clean-Room Matrix)

| # | Product / Vertical          | Supabase schema | Git repo (example)             | Writer MCP port | Pulser alias(es) | KeyKey prefix |
| - | --------------------------- | --------------- | ------------------------------ | --------------- | ---------------- | ------------- |
| 1 | **Scout Dash**              | `scout_dash`    | `scout-dash`                   | **8890**        | `:scout`, `:sd`  | `SCOUT`       |
| 2 | **HR / Admin**              | `hr_admin`      | `hr-admin-app` *(or monorepo)* | **8891**        | `:hr`            | `HR`          |
| 3 | **Finance (SUQI)**          | `financial_ops` | `suqi-db-app`                  | **8892**        | `:fin`           | `FIN`         |
| 4 | **Operations Hub**          | `operations`    | `operations-hub-app`           | **8893**        | `:ops`           | `OPS`         |
| 5 | **Corporate Portal**        | `corporate`     | `corporate-portal-app`         | **8894**        | `:corp`          | `CORP`        |
| 6 | **FACE – Senior Care**      | `face_ops`      | `face-care-app`                | **8895**        | `:face`, `:fc`   | `FACE`        |
| 7 | **CES – Creative Insights** | `creative_ops`  | `creative-insights-app`        | **8896**        | `:ces`, `:ci`    | `CES`         |
| 8 | **QA Class** *(internal)*   | `qa_class`      | `qa-class-fixtures`            | **8897**        | `:qa`            | `QA`          |

## 📏 Convention Rules

- **Schema**: `lower-snake-case` product code + `_ops` (or descriptive noun like `hr_admin`/`corporate` for legacy)
- **Writer port**: Start **8890**, increment +1 per product—never reuse
- **KeyKey/Doppler prefixes**: Match product code in ALL-CAPS
- **Pulser aliases**: Short, memorable, no conflicts

## 🚀 Scaffold Any New Product

### CES (Creative Insights) Example
```bash
npx @tbwa/create-supabase-app \
     --project  creative-insights-app \
     --schema   creative_ops \
     --port     8896 \
     --alias    ces,ci
```

**Generates:**
- ✅ `creative-insights-app` GitHub repo
- ✅ `creative_ops` Supabase schema
- ✅ PAT secrets: `CES_ANON_KEY`, `CES_SERVICE_KEY`
- ✅ Pulser agents with `:ces`, `:ci` aliases
- ✅ Render writer MCP on port 8896
- ✅ CI workflow with migrations

## 🔄 CI Matrix Configuration

```yaml
# .github/workflows/migrate.yml
matrix:
  schema: [scout_dash, hr_admin, financial_ops, operations, corporate, face_ops, creative_ops, qa_class]
  port:   [8890,      8891,     8892,          8893,       8894,      8895,      8896,        8897]
```

## 🎯 Current Implementation Status

| Product | Schema | Status | Notes |
|---------|--------|--------|-------|
| Scout Dash | `scout_dash` | ✅ **Implemented** | Dashboard live |
| Finance (SUQI) | `financial_ops` | ✅ **Implemented** | SUQI-DB-APP active |
| QA Class | `qa_class` | ✅ **Implemented** | Testing fixtures |
| HR/Admin | `hr_admin` | 🔄 **Ready to scaffold** | Employee data |
| Operations | `operations` | 🔄 **Ready to scaffold** | Workflow management |
| Corporate | `corporate` | 🔄 **Ready to scaffold** | Company portal |
| FACE | `face_ops` | 🔄 **Ready to scaffold** | Senior care platform |
| CES | `creative_ops` | 🔄 **Ready to scaffold** | Creative insights |

## 🔐 KeyKey Secret Pattern

```bash
# For each product, add to Doppler:
{PREFIX}_ANON_KEY=<read-only JWT>      # → Remote reader MCP
{PREFIX}_SERVICE_KEY=<full-access JWT> # → Local writer MCP (CI only)
```

**Examples:**
- `CES_ANON_KEY` / `CES_SERVICE_KEY`
- `FACE_ANON_KEY` / `FACE_SERVICE_KEY`
- `HR_ANON_KEY` / `HR_SERVICE_KEY`

## 🌐 Shared Infrastructure

**Remote Reader (All Products):**
- **Endpoint**: `https://mcp-supabase-clean.onrender.com`
- **Auth**: `SUPABASE_ANON_KEY` (project-wide)
- **Search Path**: `scout_dash,financial_ops,qa_class,hr_admin,operations,corporate,face_ops,creative_ops`

**Local Writers (Per Product):**
- **Endpoint**: `http://localhost:{port}`
- **Auth**: `{PREFIX}_SERVICE_KEY`
- **Usage**: Dev/CI migrations only

## ✅ Golden Path Benefits

🎯 **Consistent developer experience** across all products  
🔐 **Secure by default** - read-only remote, write-only local  
🚀 **One-command scaffold** for new products  
🔄 **Unified CI/CD** pipeline  
🤖 **Multi-AI support** - Claude, ChatGPT, Pulser CLI  
📊 **Cross-schema reporting** with FK links

---

**This matrix is the single source of truth for all TBWA product infrastructure.**