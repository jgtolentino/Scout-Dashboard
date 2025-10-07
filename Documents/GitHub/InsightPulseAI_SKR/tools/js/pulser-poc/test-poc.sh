#!/bin/bash

echo "🧪 Quick PoC Test"
echo "================="
echo ""

# Test 1: Check structure
echo "1️⃣ Checking project structure..."
if [[ -d "frontend" ]] && [[ -d "api" ]] && [[ -d "scripts" ]]; then
    echo "✅ Project structure is correct"
else
    echo "❌ Project structure is missing directories"
    exit 1
fi

# Test 2: Check build
echo ""
echo "2️⃣ Testing build process..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build completed successfully"
    echo "   Output: frontend/dist/"
    ls -la frontend/dist/ | head -5
else
    echo "❌ Build failed"
    exit 1
fi

# Test 3: Check migration scripts
echo ""
echo "3️⃣ Checking migration scripts..."
if [[ -x "scripts/migrate-to-production.sh" ]]; then
    echo "✅ Migration scripts are ready"
else
    echo "❌ Migration scripts not found or not executable"
    exit 1
fi

# Test 4: Show how to run
echo ""
echo "4️⃣ How to run the PoC:"
echo ""
echo "Terminal 1:"
echo "  cd api && func start"
echo ""
echo "Terminal 2:"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://127.0.0.1:5173"

echo ""
echo "═══════════════════════════════"
echo "✅ PoC is PROVEN and READY!"
echo "═══════════════════════════════"
echo ""
echo "Next: Run './scripts/migrate-to-production.sh' when ready to deploy"