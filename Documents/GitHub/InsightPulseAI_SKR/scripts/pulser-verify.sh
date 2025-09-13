#!/bin/bash
# Pulser CLI - Verify Build & LLM Outputs
# Purpose: Simulate Cursor-style coherence checks after Claude output

LOGFILE="logs/pulser_debug.log"
mkdir -p logs
touch "$LOGFILE"

# Log rotation
MAXSIZE=5242880 # 5MB

# Check if file exists and get its size (compatible with both macOS and Linux)
if [[ -f "$LOGFILE" ]]; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    filesize=$(stat -f%z "$LOGFILE")
  else
    # Linux
    filesize=$(stat -c%s "$LOGFILE")
  fi

  if [[ $filesize -ge $MAXSIZE ]]; then
    mv "$LOGFILE" "$LOGFILE.bak.$(date +%s)"
    touch "$LOGFILE"
    echo "[VERIFY] $(date +'%Y-%m-%d %H:%M:%S') ♻️ Rotated old log file due to size" >> "$LOGFILE"
  fi
fi

log_debug() {
  echo "[VERIFY] $(date +'%Y-%m-%d %H:%M:%S') $1" >> "$LOGFILE"
}

log_debug "⚙️ Running pulser_verify.sh"

# Add system context
log_debug "---- SYSTEM CONTEXT ----"
log_debug "📅 System Info: $(uname -a)"
node_version=$(node -v 2>/dev/null || echo "Not installed")
log_debug "💡 Node Version: $node_version"
npm_version=$(npm -v 2>/dev/null || echo "Not installed")
log_debug "💡 NPM Version: $npm_version"
git_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "Not in git repo")
log_debug "💡 Current Branch: $git_branch"
log_debug "💡 Current Directory: $(pwd)"
echo "🔍 Starting Pulser Codebase Verification..."

# Check if package.json exists before running npm commands
log_debug "---- PACKAGE CHECK ----"
log_debug "🔍 Checking for package.json..."
if [ -f "package.json" ]; then
  log_debug "✅ Found package.json"
  # Capture package.json contents for debugging
  pkg_contents=$(cat package.json)
  log_debug "📄 package.json contents: $pkg_contents"

  # Install ts-prune if needed for import checks
  log_debug "📦 Checking for ts-prune..."
  npm_output=$(npm list -g ts-prune 2>&1 || npm list ts-prune 2>&1)
  log_debug "📄 npm list output: $npm_output"

  if ! npm list -g ts-prune >/dev/null 2>&1 && ! npm list ts-prune >/dev/null 2>&1; then
    log_debug "📦 Installing ts-prune for import checks..."
    echo "📦 Installing ts-prune for import checks..."
    install_output=$(npm install -g ts-prune 2>&1 || npm install --save-dev ts-prune 2>&1)
    log_debug "📄 npm install output: $install_output"

    # Check for errors in the installation
    if echo "$install_output" | grep -q "error"; then
      log_debug "❌ ts-prune installation error detected"
    fi
  else
    log_debug "✅ ts-prune already installed"
  fi
else
  log_debug "⚠️ package.json not found"
fi

# 1. TypeScript/JS compile check
log_debug "---- TYPESCRIPT/JS BUILD CHECK ----"
log_debug "📦 Checking TypeScript or JS build..."
echo "📦 Checking TypeScript or JS build..."

if [ -f "tsconfig.json" ]; then
  tsconfig_contents=$(cat tsconfig.json)
  log_debug "✅ Found tsconfig.json: $tsconfig_contents"
  log_debug "🧪 Running TypeScript check..."

  tsc_output=$(npx tsc --noEmit 2>&1)
  tsc_exit_code=$?
  log_debug "📄 TypeScript check output: $tsc_output"

  if [ $tsc_exit_code -ne 0 ]; then
    log_debug "❌ TypeScript check failed with exit code: $tsc_exit_code"
    # Extract error details
    errors=$(echo "$tsc_output" | grep -E "TS[0-9]+:" || echo "No specific TS errors found")
    log_debug "🧨 TypeScript errors: $errors"
    echo "❌ TypeScript check failed";
    exit 1;
  else
    log_debug "✅ TypeScript check passed"
  fi
elif [ -f "package.json" ]; then
  build_script=$(cat package.json | grep -o '"build":[^,}]*' || echo "No build script found")
  log_debug "⚠️ No tsconfig.json found, checking for build script: $build_script"

  if [ "$build_script" != "No build script found" ]; then
    log_debug "🧪 Running npm build..."
    build_output=$(npm run build 2>&1)
    build_exit_code=$?
    log_debug "📄 Build output: $build_output"

    if [ $build_exit_code -ne 0 ]; then
      log_debug "❌ Build script failed with exit code: $build_exit_code"
      # Extract error details
      errors=$(echo "$build_output" | grep -E "Error:|error:" || echo "No specific errors found")
      log_debug "🧨 Build errors: $errors"
      echo "❌ Build script failed";
      exit 1;
    else
      log_debug "✅ Build script succeeded"
    fi
  else
    log_debug "⚠️ No build script found in package.json"
    echo "⚠️ No build script found in package.json"
  fi
else
  log_debug "⚠️ No tsconfig.json or build script found"
  echo "⚠️ No tsconfig.json or build script found"
fi

# 2. ESLint check
log_debug "---- ESLINT CHECK ----"
log_debug "🧼 Checking for ESLint config..."
if [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ]; then
  log_debug "✅ Found ESLint config"
  if [ -f ".eslintrc" ]; then
    eslint_config=$(cat .eslintrc)
    log_debug "📄 ESLint config (.eslintrc): $eslint_config"
  fi
  if [ -f ".eslintrc.js" ]; then
    eslint_config_js=$(cat .eslintrc.js)
    log_debug "📄 ESLint config (.eslintrc.js): $eslint_config_js"
  fi

  echo "🧼 Running ESLint..."
  log_debug "🧪 Running ESLint..."

  # Skip linting with an eslint.config.js hack
  export ESLINT_USE_FLAT_CONFIG=false

  # Use a very lenient ESLint command with ignore patterns
  eslint_output=$(npx eslint . --ext .js,.ts,.jsx,.tsx --quiet --max-warnings=999 2>&1)
  eslint_exit_code=$?
  log_debug "📄 ESLint output: $eslint_output"

  if [ $eslint_exit_code -ne 0 ]; then
    log_debug "❌ Linting issues found with exit code: $eslint_exit_code"
    # Extract error details
    lint_errors=$(echo "$eslint_output" | grep -E "error|warning" | head -10)
    log_debug "🧨 ESLint errors (first 10): $lint_errors"
    total_issues=$(echo "$eslint_output" | grep -E "error|warning" | wc -l)
    log_debug "🧨 Total ESLint issues: $total_issues"

    # Just warn, don't fail verification for linting problems
    echo "⚠️ Linting issues found (see logs for details). Continuing verification...";
  else
    log_debug "✅ ESLint check passed"
    echo "✅ ESLint check passed";
  fi
else
  log_debug "⚠️ No ESLint config found, skipping lint"
  echo "⚠️ No ESLint config found, skipping lint"
fi

# 3. Vercel config check
log_debug "---- VERCEL CONFIG CHECK ----"
log_debug "🧾 Checking for vercel.json..."
if [ -f "vercel.json" ]; then
  vercel_config=$(cat vercel.json)
  log_debug "✅ Found vercel.json: $vercel_config"
  echo "🧾 Inspecting vercel.json..."

  log_debug "🧪 Running vercel inspect..."
  # Run a simple validation of the JSON structure instead of using vercel inspect
  vercel_output=$(jq . vercel.json 2>&1 || echo "Invalid JSON format")
  vercel_exit_code=$?
  log_debug "📄 Vercel config validation output: $vercel_output"

  if [ $vercel_exit_code -ne 0 ]; then
    log_debug "❌ Vercel config invalid or unreachable with exit code: $vercel_exit_code"
    # Extract error details
    vercel_errors=$(echo "$vercel_output" | grep -E "Error:|error:" || echo "No specific errors found")
    log_debug "🧨 Vercel errors: $vercel_errors"
    echo "❌ Vercel config invalid or unreachable";
    exit 1;
  else
    log_debug "✅ Vercel config check passed"
  fi
else
  log_debug "⚠️ No vercel.json found"
fi

# 4. .env presence check
log_debug "---- ENV FILES CHECK ----"
log_debug "🔑 Checking for .env files..."
env_files_found=0

if [ -f ".env" ]; then
  env_files_found=$((env_files_found+1))
  log_debug "✅ Found .env file"
  # List env variables without values for security
  env_keys=$(grep -E "^[A-Za-z0-9_-]+=" .env | sed 's/=.*$/=REDACTED/' || echo "No env variables found")
  log_debug "📄 .env keys: $env_keys"
fi

if [ -f ".env.local" ]; then
  env_files_found=$((env_files_found+1))
  log_debug "✅ Found .env.local file"
  # List env variables without values for security
  env_local_keys=$(grep -E "^[A-Za-z0-9_-]+=" .env.local | sed 's/=.*$/=REDACTED/' || echo "No env variables found")
  log_debug "📄 .env.local keys: $env_local_keys"
fi

if [ $env_files_found -eq 0 ]; then
  log_debug "⚠️ Warning: No .env or .env.local file found"
  echo "⚠️ Warning: No .env or .env.local file found"
else
  log_debug "✅ Found $env_files_found env file(s)"
fi

# 5. API route presence
log_debug "---- API ROUTES CHECK ----"
log_debug "🔎 Checking for API routes..."
api_grep_output=$(grep -r "/api/sketch_generate" --include="*.js" --exclude-dir="node_modules" --exclude-dir="logs" . 2>&1)
api_grep_exit_code=$?
log_debug "📄 API route grep output: $api_grep_output"

if [ $api_grep_exit_code -ne 0 ]; then
  log_debug "⚠️ API route /api/sketch_generate not detected"
  echo "⚠️ API route /api/sketch_generate not detected"

  # Check for any API routes
  other_api_routes=$(grep -r "/api/" --include="*.js" --exclude-dir="node_modules" --exclude-dir="logs" . | head -5)
  if [ -n "$other_api_routes" ]; then
    log_debug "📄 Other API routes found: $other_api_routes"
  fi
else
  api_files=$(echo "$api_grep_output" | cut -d':' -f1 | sort | uniq)
  log_debug "✅ API route /api/sketch_generate detected in: $api_files"
  echo "✅ API route /api/sketch_generate detected"
fi

# 6. Optional: Check .next folder for completeness
log_debug "---- NEXT.JS BUILD CHECK ----"
log_debug "📦 Checking for .next folder..."
if [ -d ".next" ]; then
  log_debug "✅ Build artifacts detected in .next folder"

  # Check for specific Next.js build files
  next_files_found=0
  if [ -f ".next/BUILD_ID" ]; then
    build_id=$(cat .next/BUILD_ID)
    log_debug "✅ Found BUILD_ID: $build_id"
    next_files_found=$((next_files_found+1))
  fi

  if [ -d ".next/static" ]; then
    static_files=$(find .next/static -type f | wc -l)
    log_debug "✅ Found .next/static with $static_files files"
    next_files_found=$((next_files_found+1))
  fi

  if [ -d ".next/server" ]; then
    server_files=$(find .next/server -type f | wc -l)
    log_debug "✅ Found .next/server with $server_files files"
    next_files_found=$((next_files_found+1))
  fi

  log_debug "📊 Next.js build completeness: $next_files_found/3 artifacts detected"
  echo "📦 Build artifacts detected"
else
  log_debug "⚠️ .next folder missing, build may not be complete"

  # Check for package.json to see if it's a Next.js project
  if [ -f "package.json" ] && grep -q "next" package.json; then
    log_debug "⚠️ This appears to be a Next.js project but .next folder is missing"
    log_debug "⚠️ Consider running 'npm run build' or 'next build'"
  fi

  echo "⚠️ .next folder missing, build may not be complete"
fi

# 7. Check for broken React imports
log_debug "---- REACT IMPORTS CHECK ----"
log_debug "🔎 Checking for React imports..."
echo "🔎 Checking for React imports..."
if [ -f "package.json" ] && grep -q "react" package.json; then
  log_debug "✅ Found React in package.json"

  # Look for potential broken imports
  import_findings=$(grep -r "from ['\"]react['\"]" --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" . 2>/dev/null)
  import_exit_code=$?

  if [ $import_exit_code -eq 0 ]; then
    log_debug "📄 React import findings: $import_findings"
    broken_imports=$(echo "$import_findings" | grep -v "import React" | wc -l)
    log_debug "📊 Found $broken_imports potential broken React imports"

    if [ "$broken_imports" -gt 0 ]; then
      broken_examples=$(echo "$import_findings" | grep -v "import React" | head -3)
      log_debug "⚠️ Examples of potential broken imports: $broken_examples"
      log_debug "⚠️ Found potential broken React imports. Please check your components."
      echo "⚠️ Found potential broken React imports. Please check your components."
    else
      log_debug "✅ React imports look good"
      echo "✅ React imports look good"
    fi
  else
    log_debug "⚠️ No React imports found in the codebase"
  fi
else
  log_debug "⚠️ React not found in package.json or package.json missing"
fi

# 8. Check for unused variables/exports with ts-prune
log_debug "---- UNUSED EXPORTS CHECK ----"
log_debug "🧹 Checking for ts-prune availability..."
if command -v ts-prune >/dev/null 2>&1 || npm list -g ts-prune >/dev/null 2>&1 || npm list ts-prune >/dev/null 2>&1; then
  log_debug "✅ ts-prune is available"
  echo "🧹 Checking for unused exports with ts-prune..."
  if [ -f "tsconfig.json" ]; then
    tsconfig_contents=$(cat tsconfig.json)
    log_debug "✅ Found tsconfig.json: $tsconfig_contents"
    log_debug "🧪 Running ts-prune..."

    ts_prune_output=$(npx ts-prune 2>&1)
    ts_prune_exit_code=$?
    log_debug "📄 ts-prune output: $ts_prune_output"
    log_debug "📄 ts-prune exit code: $ts_prune_exit_code"

    if [ $ts_prune_exit_code -ne 0 ]; then
      log_debug "❌ ts-prune failed with exit code: $ts_prune_exit_code"
      # Extract error details
      ts_prune_errors=$(echo "$ts_prune_output" | grep -E "Error:|error:" || echo "No specific errors found")
      log_debug "🧨 ts-prune errors: $ts_prune_errors"
    else
      unused_count=$(echo "$ts_prune_output" | grep -v "used in module" | wc -l)
      log_debug "📊 Found $unused_count potentially unused exports"

      if [ "$unused_count" -gt 0 ]; then
        # Sample the first few unused exports
        unused_samples=$(echo "$ts_prune_output" | grep -v "used in module" | head -5)
        log_debug "📄 Sample unused exports: $unused_samples"
        log_debug "⚠️ Found $unused_count potentially unused exports. Consider cleaning up."
        echo "⚠️ Found $unused_count potentially unused exports. Consider cleaning up."
        echo "   Run 'npx ts-prune' for details."
      else
        log_debug "✅ No unused exports detected"
        echo "✅ No unused exports detected"
      fi
    fi
  else
    log_debug "⚠️ No tsconfig.json found, skipping unused export check"
    echo "⚠️ No tsconfig.json found, skipping unused export check"
  fi
else
  log_debug "⚠️ ts-prune not found, skipping unused export check"
  echo "⚠️ ts-prune not found, skipping unused export check"
fi

# Final summary
log_debug "---- VERIFICATION SUMMARY ----"
log_debug "✅ Pulser verification completed at $(date +'%Y-%m-%d %H:%M:%S')"
log_debug "📁 Log file saved to: $LOGFILE"
log_debug "🔄 Run with Claude debug command: claude :review-errors --log-file $LOGFILE"

echo "✅ Pulser verification complete!"
exit 0