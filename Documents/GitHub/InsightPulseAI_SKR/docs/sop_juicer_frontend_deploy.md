# SOP: Juicer Frontend Deployment via Stacey
Pulser v2.0 | Last updated: 2025-05-09

## ✅ Prerequisites
- Node.js ≥ 18.x installed
- Pulser repo cloned and synced
- `scripts/build_stacey_ui.sh` present and executable
- Stacey and Claudia agent definitions synced to SKR

## 📁 Directory Structure

```
/scripts/
└── build_stacey_ui.sh
/juicer/frontend/
├── AssistantPanel.jsx
├── CommandInput.jsx
├── ChartWrapper.jsx
└── SunniesBridge.js
/docs/
├── juicer_implementation_plan.md
└── sop_juicer_frontend_deploy.md
```

## 🧪 Setup Instructions

1. Make script executable:
   ```bash
   chmod +x ./scripts/build_stacey_ui.sh
   ```

2. Run deployment script:
   ```bash
   ./scripts/build_stacey_ui.sh
   ```

3. Start local frontend:
   ```bash
   cd juicer/frontend
   npm install
   npm run dev
   ```

4. Access UI:
   Open `http://localhost:3000` in browser

## 🔍 Validation

* Shell loads with working input box
* Autocomplete suggests known commands (`/status`, `/help`, etc.)
* Output renders under AssistantPanel
* ChartWrapper loads a dummy chart (if Sunnies backend is live)
* Check browser console for rendering errors

## 🧯 Rollback

If errors occur:
```bash
git checkout -- juicer/frontend/
```

To reset state:
```bash
rm -rf node_modules && npm install
```

---

## Notes

This procedure supports Pulser 2.0 integration with Claudia, Basher, and Caca. All outputs must be committed through `pulser-commit` and pass QA checks.