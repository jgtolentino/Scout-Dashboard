# 🚀 How to Start the PoC

## Option 1: Test Page (Easiest)

1. **Make sure API is running:**
   ```bash
   ps aux | grep "node server.js"
   ```
   
   If not running:
   ```bash
   cd api
   node server.js
   ```

2. **Open the test page:**
   - Open `test.html` in your browser
   - You should see the dashboard with live data

## Option 2: Full React App

### Terminal 1 - API:
```bash
cd api
node server.js
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev -- --host 127.0.0.1
```

Then open: http://127.0.0.1:5173

## Troubleshooting

If you get connection refused:

1. **Check API is running:**
   ```bash
   curl http://127.0.0.1:7071/api/transactions
   ```

2. **Kill stuck processes:**
   ```bash
   lsof -ti:5173 | xargs kill -9
   lsof -ti:7071 | xargs kill -9
   ```

3. **Try the test page first** - it's a standalone HTML file that proves the concept

## What You Should See

- Transaction trends chart (30 days)
- Total transactions: ~2,900
- Total amount: ~$130,000
- Average per transaction: ~$45

The test page (`test.html`) is the quickest way to prove the PoC works!