# ── MVP DEBUG & ALIGNMENT SOP ──
version: v1.0
owner: claudia
qa: caca
agents:
  - jess (git)
  - echo (signal)
  - kalaw (context)
  - maya (doc)

────────────────────────────────────────────
PHASE 1: SANITY CHECK FRAMEWORK
────────────────────────────────────────────

▶ DEPENDENCY CHECK
$ npm ci --omit=dev
$ npm audit --audit-level=critical
$ npx depcheck --ignores="@types/*"

▶ ENVIRONMENT VALIDATION (Jest)
- test Node version === v18
- test heap < 2GB

▶ SMOKE TEST (REST)
- POST /process { input: "...", context: "cli" }
- GET /health

▶ ERROR LOG AUDIT
$ cat logs/errors.log | grep "ERR!" | sort | uniq -c | sort -nr

────────────────────────────────────────────
PHASE 2: MVP ALIGNMENT PROCESS
────────────────────────────────────────────

▶ PRIORITY FLOWS

| P | Flow                   | Test Command                                 |
|---|------------------------|-----------------------------------------------|
| 0 | Codegen + Validate     | npx your-cli generate "React login" --test   |
| 0 | Error Recovery         | npx your-cli debug brokenFile.js             |
| 1 | GitOps Push            | npx your-cli commit "fix auth" --push        |

▶ ISSUE TRIAGE

| Sev | Impact     | Example                      | Action        |
|-----|------------|------------------------------|---------------|
| 🔴  | Blocks MVP | Agent crash on Python input  | fix now       |
| 🟠  | Slow Core  | Codegen > 30s                | pre-MVP fix   |
| 🟡  | UX glitch  | Markdown error               | post-MVP      |
| ⚪  | Cosmetic    | Typo in help                 | backlog       |

▶ ARCHITECTURE CHECK

graph TD  
  A[User Input] --> B(Intent Parser)  
  B --> C{Code?}  
  C -->|Yes| D[Codex Pipeline]  
  C -->|No| E[OpenMannus RAG]  
  D --> F[Test Gen]  
  E --> G[Fact Check]  

────────────────────────────────────────────
PHASE 3: DEBUG WORKFLOW
────────────────────────────────────────────

▶ STRATEGIC BREAKPOINTS
- `debug()` in key pipeline files
- run via:  
  $ DEBUG=codegen*,rag* npx your-cli

▶ AI-ASSISTED DEBUG
- VSCode Copilot → "Explain This" → "Suggest fix for [error]"

▶ TEST-DRIVEN DEBUG
```ts
test("broken JS fix", async () => {
  const badCode = `function sum(a, b) { retrn a + b; }`;
  const result = await debugger.analyze(badCode);
  expect(result.suggestions).toContain("Did you mean 'return'?");
});
```

────────────────────────────────────────────
PHASE 4: MVP REFACTOR
────────────────────────────────────────────

▶ REMOVE NON-ESSENTIALS
$ npx ts-prune
$ npx nestia-route explorer src/**/*.controller.ts

▶ PIPELINE CLEANUP

```ts
// before: 150-line async monster
async function processInput(input) { ... }

// after:
const inputPipeline = [sanitizeInput, resolveIntent, routeToAgent, applyGuardrails];
async function processInput(input) {
  return inputPipeline.reduce(async (chain, step) => step(await chain), Promise.resolve(input));
}
```

────────────────────────────────────────────
TOOLS & SETUP
────────────────────────────────────────────

▶ DEBUG DASHBOARD
$ npm i -D ndb
$ npm run inspect  # uses ndb ./src/main.ts

▶ PERFORMANCE BASELINE
jest.config.js:

```js
reporters: [
  "default",
  ["jest-bench", { output: "./reports/benchmark.md" }]
]
```

▶ ERROR MONITORING
$ npm i @sentry/node @sentry/integrations

```ts
Sentry.init({ dsn: process.env.SENTRY_DSN, integrations: [...] });
```

────────────────────────────────────────────
MVP GATE CRITERIA
────────────────────────────────────────────

* [x] ✅ 95% pass on P0 test cases
* [x] ⚡ Codegen < 500ms avg latency
* [x] 🔒 Zero critical vulnerabilities
* [x] 🔁 CI/CD operational
* [x] 📊 Typedoc + logs generated

────────────────────────────────────────────
END OF SOP
────────────────────────────────────────────