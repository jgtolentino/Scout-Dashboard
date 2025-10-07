#!/bin/bash

# Pulser MVP Status Validator
# This script validates the Pulser MVP against expected checkpoints

LOG_FILE="$HOME/claudia_sync.log"
PULSER_PATH="$HOME/pulser-app"

echo "🔍 Validating Pulser MVP status..." | tee -a "$LOG_FILE"

# Step 1: Set Pulser project path
if [ ! -d "$PULSER_PATH" ]; then
  echo "❌ Pulser project not found at $PULSER_PATH" | tee -a "$LOG_FILE"
  exit 1
fi

echo "✅ Pulser project found at $PULSER_PATH" | tee -a "$LOG_FILE"

# Step 2: Confirm core project structure exists
echo "🔍 Checking core project structure..."
CORE_FILES=("package.json" "vite.config.js" "electron.js") # Using electron.js instead of main.js
CORE_DIRS=("public" "src")

STRUCTURE_OK=true
for file in "${CORE_FILES[@]}"; do
  if [ ! -f "$PULSER_PATH/$file" ]; then
    echo "❌ Missing core file: $file" | tee -a "$LOG_FILE"
    STRUCTURE_OK=false
  fi
done

for dir in "${CORE_DIRS[@]}"; do
  if [ ! -d "$PULSER_PATH/$dir" ]; then
    echo "❌ Missing core directory: $dir" | tee -a "$LOG_FILE"
    STRUCTURE_OK=false
  fi
done

if [ "$STRUCTURE_OK" = true ]; then
  echo "✅ Core project structure validated" | tee -a "$LOG_FILE"
else
  echo "❌ Core project structure incomplete" | tee -a "$LOG_FILE"
fi

# Step 3: Validate dependencies
echo "🔍 Checking dependencies..."
if [ ! -f "$PULSER_PATH/package.json" ]; then
  echo "❌ package.json not found" | tee -a "$LOG_FILE"
else
  DEPENDENCIES_OK=true
  REQUIRED_DEPS=("electron" "react" "openai" "vite" "tailwindcss")
  
  for dep in "${REQUIRED_DEPS[@]}"; do
    if ! grep -q "\"$dep\"" "$PULSER_PATH/package.json"; then
      echo "❌ Missing dependency: $dep" | tee -a "$LOG_FILE"
      DEPENDENCIES_OK=false
    fi
  done
  
  if [ "$DEPENDENCIES_OK" = true ]; then
    echo "✅ All required dependencies found" | tee -a "$LOG_FILE"
  else
    echo "❌ Some dependencies are missing" | tee -a "$LOG_FILE"
  fi
fi

# Step 4: Validate build scripts
echo "🔍 Checking build scripts..."
if [ ! -f "$PULSER_PATH/package.json" ]; then
  echo "❌ package.json not found" | tee -a "$LOG_FILE"
else
  SCRIPTS_OK=true
  REQUIRED_SCRIPTS=("dev" "build")
  ELECTRON_SCRIPT_FOUND=false
  
  for script in "${REQUIRED_SCRIPTS[@]}"; do
    if ! grep -q "\"$script\":" "$PULSER_PATH/package.json"; then
      echo "❌ Missing script: $script" | tee -a "$LOG_FILE"
      SCRIPTS_OK=false
    fi
  done
  
  if grep -q "\"electron:dev\":" "$PULSER_PATH/package.json" || grep -q "\"electron:build\":" "$PULSER_PATH/package.json" || grep -q "\"electron:preview\":" "$PULSER_PATH/package.json"; then
    ELECTRON_SCRIPT_FOUND=true
    echo "✅ Electron scripts found" | tee -a "$LOG_FILE"
  else
    echo "❌ Missing electron scripts" | tee -a "$LOG_FILE"
    SCRIPTS_OK=false
  fi
  
  if [ "$SCRIPTS_OK" = true ]; then
    echo "✅ All required build scripts found" | tee -a "$LOG_FILE"
  else
    echo "❌ Some build scripts are missing" | tee -a "$LOG_FILE"
  fi
fi

# Step 5: Check for OpenAI integration
echo "🔍 Checking OpenAI integration..."
if [ ! -d "$PULSER_PATH/src" ]; then
  echo "❌ src directory not found" | tee -a "$LOG_FILE"
else
  if grep -rq "openai\." "$PULSER_PATH/src" || grep -rq "createChatCompletion" "$PULSER_PATH/src"; then
    echo "✅ OpenAI integration found" | tee -a "$LOG_FILE"
  else
    echo "❌ OpenAI integration not found" | tee -a "$LOG_FILE"
  fi
fi

# Step 6: Confirm Pulser branding
echo "🔍 Checking Pulser branding..."
if [ ! -d "$PULSER_PATH/src" ]; then
  echo "❌ src directory not found" | tee -a "$LOG_FILE"
else
  if grep -rq "Pulser" "$PULSER_PATH/src"; then
    echo "✅ Pulser branding found" | tee -a "$LOG_FILE"
    
    # Check for any remaining Pointer references
    if grep -rq "Pointer" "$PULSER_PATH/src"; then
      echo "⚠️ Warning: Found Pointer references that should be replaced with Pulser" | tee -a "$LOG_FILE"
    fi
  else
    echo "❌ Pulser branding not found" | tee -a "$LOG_FILE"
  fi
fi

# Step 7: Test local build
echo "🔍 Testing local build..."
cd "$PULSER_PATH"
if npm run build; then
  echo "✅ Local build successful" | tee -a "$LOG_FILE"
else
  echo "❌ Local build failed" | tee -a "$LOG_FILE"
fi

# Step 8: Log final validation
ALL_CHECKS_PASSED=true

if [ "$STRUCTURE_OK" != true ] || [ "$DEPENDENCIES_OK" != true ] || [ "$SCRIPTS_OK" != true ]; then
  ALL_CHECKS_PASSED=false
fi

if [ "$ALL_CHECKS_PASSED" = true ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') ✅ Pulser MVP status: All core features verified." | tee -a "$LOG_FILE"
else
  echo "$(date '+%Y-%m-%d %H:%M:%S') ⚠️ Pulser MVP status: Some features need attention." | tee -a "$LOG_FILE"
fi

echo "🔍 Validation complete. See details above."