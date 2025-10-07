# 🚀 AI-Powered Codebase Tutoring for **Project Scout**  
*(Vite + React 18 / Azure Functions TS / Azure OpenAI GPT-4o)*

This guide lets any engineer clone, run, and extend the **premium, AI-driven Scout Dashboard** from scratch.

---

## 1️⃣  Ingest the Repo Structure

```bash
git clone https://github.com/tbwa-smp/project-scout.git
cd project-scout
npm i -g tree
tree -L 3
```
Paste the tree into Copilot Chat / Claude for context.

---

## 2️⃣ Bootstrap the Front-End (Vite + React 18 + Tailwind CSS)

```bash
# one-time
npm create vite@latest frontend -- --template react-ts
cd frontend
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

*Update `tailwind.config.js`*:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

Add **Premium card** → `src/components/PremiumInsightsCard.tsx`.

---

## 3️⃣ Bootstrap the Back-End (Azure Functions TS / Node 20)

```bash
# root of repo
func init api --worker-runtime node --language typescript
cd api
func new --template "HTTP trigger" --name premium-insights
npm i axios @azure/identity prisma
```

### `api/premium-insights/index.ts`

```ts
import { AzureFunction, Context } from "@azure/functions";
import axios from "axios";

const OPENAI_KEY = process.env.AZURE_OPENAI_KEY!;
const ENDPOINT   = process.env.AZURE_OPENAI_ENDPOINT!;
const DEPLOYMENT = "gpt4o-prod";

const httpTrigger: AzureFunction = async (ctx: Context, req) => {
  const roles = (req.headers["x-ms-client-roles"] || "").split(",");
  if (!roles.includes("Gold") && !roles.includes("Platinum")) {
    ctx.res = { status: 403, body: "Premium tier required" }; return;
  }

  // sample KPI pull via Prisma
  const db = new (await import('../../prisma/client')).default();
  const kpi = await db.kpis.findFirst({ orderBy: { date: "desc" }});

  const sys  = `You are an FMCG retail analyst. Reply JSON only:
  { "headline": "", "bullets": [], "recommendation": "" }`;
  const user = `Latest KPIs: ${JSON.stringify(kpi)}`;

  const { data } = await axios.post(
    `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`,
    { messages:[{role:"system",content:sys},{role:"user",content:user}],
      temperature:0.4,max_tokens:300 },
    { headers:{ "api-key":OPENAI_KEY } }
  );

  ctx.res = {
    status: 200,
    headers: { "Content-Type":"application/json" },
    body: JSON.parse(data.choices[0].message.content)
  };
};
export default httpTrigger;
```

---

## 4️⃣ Secure Routing with Role Gating

`staticwebapp.config.json`

```jsonc
{
  "routes": [
    { "route": "/api/premium-insights", "allowedRoles": ["Gold","Platinum"] },
    { "route": "/api/*", "allowedRoles": ["anonymous"] },
    { "route": "/*", "redirect": "/login" }
  ]
}
```

*Roles "Gold" & "Platinum" are defined in Entra ID and attached via SWA auth.*

---

## 5️⃣ CI/CD (GitHub Actions)

Workflow: `.github/workflows/auto-fix-deployment-workflow-enhanced.yml`

*Already does:*
1. `npm ci` + lint + test  
2. Build Vite → `frontend/dist/`  
3. `func azure functionapp publish` for `/api`  
4. Deploy to **scout-dashboard-fresh-start** SWA  
5. Auto-fix retry on failure, opens GitHub Issue if unresolved  

_No changes needed; it will pick up premium-insights automatically._

---

## 6️⃣ Front-End Integration

```ts
// src/api/premium.ts
export async function getPremium() {
  const res = await fetch('/api/premium-insights');
  return res.status === 403 ? null : await res.json();
}

// src/components/PremiumInsightsCard.tsx
useEffect(() => {
  getPremium().then(data => data && setInsights(data));
}, []);
```

Render the `<PremiumInsightsCard>` only when data exists.

---

## 7️⃣ Onboarding Cheatsheet (`docs/AI_ONBOARDING.md`)

**Setup**: `npm i && npm run dev` (frontend) | `func host start` (api)  
**Secrets**: `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT` in Function App  
**Add new premium insight**: copy `premium-insights`, new route, add role gate.  

---

## 8️⃣ Copilot / Claude Tutoring Prompts

*High-level tour*

> "Here's the repo tree. Give me a 1-paragraph summary and 5 key files."  

*File deep dive*

> "Explain `api/premium-insights/index.ts` line-by-line."  

*POC instructions*

> "Show exact steps to add a new KPI card that calls `api/transactions`."  

---

## 9️⃣ Testing & Monitoring

* **Jest** unit for role 403 / 200  
* **Playwright** E2E for premium card visibility  
* **Azure App Insights** alert if GPT-4o call >2 s or 5xx in 5 min window  

---

## 🔟 Infra-as-Code (optional)

`infra/main.bicep` provisions:  
```bicep
resource swa 'Microsoft.Web/staticSites@2022-09-01' = ...
resource func 'Microsoft.Web/sites@2023-01-01' = ...
resource sql  'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = ...
resource kvar 'Microsoft.KeyVault/vaults@2023-02-01' = ...
```

Run with:

```bash
az deployment sub create \
  --location eastus2 \
  --template-file infra/main.bicep
```

---

### 🎯 Outcome

* **Gold / Platinum** customers see live AI insights powered by GPT-4o.  
* **Standard** users get the baseline dashboard (or upsell).  
* CI/CD self-heals; every failure becomes a documented fix.  
* New engineers can learn the stack in < 1 day via this blueprint.

Copy, commit, and share—your AI-powered Project Scout is now fully documented and premium-ready!