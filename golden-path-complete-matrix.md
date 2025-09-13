# 🚀 TBWA "One-Click" Product-Repo Recipe - Complete Matrix

## 📊 Complete Product Portfolio

| Product / App | Supabase schema | Git repo (example) | Writer MCP port | Pulser alias(es) | KeyKey prefix |
|---------------|-----------------|-------------------|-----------------|------------------|---------------|
| **Scout Dash** | `scout_dash` | `scout-dash` | 8890 | `:scout`, `:sd` | `SCOUT` |
| **HR / Admin** | `hr_admin` | `(monorepo package)` | 8891 | `:hr` | `HR` |
| **SUQI-DB-APP (Finance)** | `financial_ops` | `suqi-db-app` | 8892 | `:fin` | `FIN` |
| **Operations Hub** | `operations` | `(monorepo package)` | 8893 | `:ops` | `OPS` |
| **Corporate Portal** | `corporate` | `(monorepo package)` | 8894 | `:corp` | `CORP` |
| **FACE (senior care)** | `face_ops` | `face-care-app` | 8895 | `:face`, `:fc` | `FACE` |
| **CES - Creative Insights** | `creative_ops` | `creative-insights-app` | 8896 | `:ces`, `:ci` | `CES` |
| **QA Class** | `qa_class` | `qa-class-app` | 8897 | `:qa` | `QA` |

## 🔄 Rule of Thumb

- **Schema**: `snake_case_product_code` + `_ops` (except HR, corporate, etc.)
- **Writer port**: Start at 8890 and bump by 1 for each new schema
- **Shared reader**: `https://mcp-supabase-clean.onrender.com` (all schemas)

---

## 1️⃣ Scaffold New Repo (CES Example)

```bash
npx @tbwa/create-supabase-app            \
     --project  creative-insights-app    \
     --schema   creative_ops             \
     --port     8896                     \
     --alias    ces,ci
```

**The generator will:**
- Fork template → `github.com/tbwa/creative-insights-app`
- Create Supabase `creative_ops` schema (+ PATs)
- Reserve writer MCP on port 8896 (disabled in prod)
- Pre-seed repo skeleton (Prisma, migrations, OpenAPI spec, Pulser agents, CI workflow)

---

## 2️⃣ CES Starter Tables (`migrations/001_init.sql`)

```sql
create table creative_ops.campaigns(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id uuid,
  start_date date not null,
  end_date date,
  budget decimal(10,2),
  created_at timestamp default now()
);

create table creative_ops.assets(
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references creative_ops.campaigns(id),
  asset_type text not null, -- 'video', 'image', 'copy'
  file_url text,
  performance_score decimal(3,2),
  created_at timestamp default now()
);

create table creative_ops.insights(
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references creative_ops.assets(id),
  metric_name text not null, -- 'ctr', 'engagement', 'reach'
  metric_value decimal(10,4),
  recorded_at timestamp default now()
);
```

---

## 3️⃣ Cross-Schema FK Links (CES ↔ HR ↔ Finance)

```sql
-- Link campaigns to HR employees (account managers)
alter table creative_ops.campaigns
  add column account_manager_id uuid
      references hr_admin.employees(id);

-- Link campaigns to financial budgets
alter table creative_ops.campaigns
  add column budget_code text,
  add constraint fk_budget 
      foreign key (budget_code) 
      references financial_ops.budget_lines(code);

-- View for cross-team reporting
create view creative_ops.campaign_summary as
select 
  c.id,
  c.name,
  c.budget,
  e.full_name as account_manager,
  bl.department as budget_department
from creative_ops.campaigns c
left join hr_admin.employees e on c.account_manager_id = e.id
left join financial_ops.budget_lines bl on c.budget_code = bl.code;
```

---

## 4️⃣ KeyKey / Doppler Secrets 🔑

```bash
doppler secrets set \
  CES_ANON_KEY=<anon PAT> \
  CES_SERVICE_KEY=<service PAT> \
  --project tbwa-platform-keykey
```

**Secret Distribution:**
- All secrets ending in `_ANON_KEY` → stream to remote reader
- `*_SERVICE_KEY` → stream to writer jobs only

---

## 5️⃣ CI Matrix Update

```yaml
# .github/workflows/migrate.yml
matrix:
  schema: [hr_admin, financial_ops, operations, corporate, face_ops, creative_ops, qa_class]
  port:   [8891,     8892,          8893,       8894,      8895,      8896,        8897]
```

Each row triggers GitHub Action to:
1. Spin local writer (`npm run writer:<alias>`)
2. Run migrations
3. Smoke-test connectivity
4. Exit

---

## 6️⃣ Local Dev Cheat-Sheet 🧑‍💻

```bash
# New dev gets repo + env vars
git clone git@github.com:tbwa/creative-insights-app.git
cd creative-insights-app
direnv allow          # loads CES_* keys automatically

npm i
npm run writer:ces &  # starts creative_ops writer on :8896
pulser call lw ddl "psql -f migrations/001_init.sql"
```

**Reader is shared (read-only) at:**
`https://mcp-supabase-clean.onrender.com`

```bash
:rr "select count(*) from creative_ops.campaigns;"
```

---

## 7️⃣ ChatGPT / Claude Usage

| Tool | Example |
|------|---------|
| **Pulser / Claude** | `:ces "show top performing assets this month"` |
| **ChatGPT plugin** | `GET /ces/campaigns?limit=10` (search_path=creative_ops) |

---

## ✅ Launch Checklist (Copy for Every New Product)

1. ✅ Run scaffolder (`create-supabase-app`) with new schema + port
2. ✅ Add PATs to KeyKey / Doppler  
3. ✅ PR → CI pipeline green (migrations applied)
4. ✅ Merge to main → Render auto-deploys writer (OFF in prod)
5. ✅ Verify remote reader can `select * from new_schema`
6. ✅ Share new Pulser alias (`:ces`) with analysts

---

## 🎯 Current Architecture Status

**Implemented Schemas:**
- ✅ `scout_dash` (Scout Dashboard)
- ✅ `financial_ops` (SUQI-DB-APP)  
- ✅ `qa_class` (QA Training)

**Ready to Scaffold:**
- 🔄 `hr_admin` (HR/Admin)
- 🔄 `operations` (Operations Hub)
- 🔄 `corporate` (Corporate Portal)
- 🔄 `face_ops` (FACE senior care)
- 🔄 `creative_ops` (CES Creative Insights)

Repeat these steps and all verticals will have identical developer experience across Claude Desktop, ChatGPT tools, and Pulser CLI!