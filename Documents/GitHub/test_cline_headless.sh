#!/bin/bash
# Headless Test for Cline Local Setup
# Tests all components without requiring GUI interaction

set -e

echo "🧪 CLINE HEADLESS TEST SUITE"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass_test() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((TESTS_PASSED++))
}

fail_test() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((TESTS_FAILED++))
}

warn_test() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
}

echo ""
echo "🔍 Test 1: Ollama Service Status"
echo "--------------------------------"

if pgrep -f "ollama" > /dev/null; then
    pass_test "Ollama process is running"
else
    fail_test "Ollama process not found"
fi

if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    VERSION=$(curl -s http://localhost:11434/api/version | jq -r '.version' 2>/dev/null || echo "unknown")
    pass_test "Ollama API accessible (version: $VERSION)"
else
    fail_test "Ollama API not accessible on localhost:11434"
fi

echo ""
echo "🔍 Test 2: Model Availability"
echo "-----------------------------"

if ollama list | grep -q "deepseek-coder"; then
    pass_test "deepseek-coder model is available"
else
    fail_test "deepseek-coder model not found"
    echo "   Run: ollama pull deepseek-coder:6.7b-instruct-q4_K_M"
fi

echo ""
echo "🔍 Test 3: OpenAI-Compatible API"
echo "--------------------------------"

if curl -s http://localhost:11434/v1/models > /dev/null 2>&1; then
    MODELS=$(curl -s http://localhost:11434/v1/models | jq -r '.data[].id' 2>/dev/null | wc -l)
    pass_test "OpenAI-compatible endpoint accessible ($MODELS models found)"
else
    fail_test "OpenAI-compatible endpoint not responding"
fi

echo ""
echo "🔍 Test 4: Cline CLI Installation"
echo "---------------------------------"

if command -v cline > /dev/null 2>&1; then
    CLINE_VERSION=$(cline --version 2>/dev/null || echo "unknown")
    pass_test "Cline CLI installed (version: $CLINE_VERSION)"
else
    fail_test "Cline CLI not found in PATH"
fi

echo ""
echo "🔍 Test 5: Workspace Configuration"
echo "----------------------------------"

if [[ -d ~/cline-local ]]; then
    pass_test "Cline workspace directory exists"
else
    fail_test "Cline workspace directory not found"
fi

if [[ -f ~/cline-local/.vscode/settings.json ]]; then
    pass_test "VS Code settings file exists"
    
    # Check settings content
    if grep -q "openai-compatible" ~/cline-local/.vscode/settings.json; then
        pass_test "OpenAI-compatible provider configured"
    else
        fail_test "OpenAI-compatible provider not configured"
    fi
    
    if grep -q "localhost:11434" ~/cline-local/.vscode/settings.json; then
        pass_test "Ollama URL configured correctly"
    else
        fail_test "Ollama URL not configured"
    fi
    
    if grep -q "deepseek-coder" ~/cline-local/.vscode/settings.json; then
        pass_test "deepseek-coder model configured"
    else
        fail_test "deepseek-coder model not configured"
    fi
else
    fail_test "VS Code settings file not found"
fi

echo ""
echo "🔍 Test 6: API Communication Test"
echo "---------------------------------"

# Test simple completion request
COMPLETION_TEST=$(cat << 'EOF'
{
  "model": "deepseek-coder:6.7b-instruct-q4_K_M",
  "messages": [
    {
      "role": "user",
      "content": "Write a simple hello world in Python"
    }
  ],
  "max_tokens": 50,
  "temperature": 0.1
}
EOF
)

if curl -s -X POST http://localhost:11434/v1/chat/completions \
   -H "Content-Type: application/json" \
   -d "$COMPLETION_TEST" | grep -q "choices"; then
    pass_test "Chat completions API working"
else
    fail_test "Chat completions API not responding correctly"
fi

echo ""
echo "🔍 Test 7: VS Code Extension Check"
echo "----------------------------------"

if [[ -d ~/Library/Application\ Support/Code/User/globalStorage ]]; then
    pass_test "VS Code user directory exists"
else
    warn_test "VS Code user directory not found (extension may not be installed)"
fi

echo ""
echo "🔍 Test 8: File System Permissions"
echo "----------------------------------"

if [[ -w ~/cline-local ]]; then
    pass_test "Workspace directory is writable"
else
    fail_test "Workspace directory is not writable"
fi

# Test file creation
TEST_FILE=~/cline-local/test_file_$(date +%s).txt
if echo "test" > "$TEST_FILE" 2>/dev/null; then
    pass_test "Can create files in workspace"
    rm -f "$TEST_FILE"
else
    fail_test "Cannot create files in workspace"
fi

echo ""
echo "📊 TEST SUMMARY"
echo "==============="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "Your Cline local setup is fully functional."
    echo ""
    echo "Next steps:"
    echo "1. Open VS Code: open -a 'Visual Studio Code' ~/cline-local"
    echo "2. Install Cline extension if needed"
    echo "3. Start coding with local AI!"
    exit 0
else
    echo ""
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "Please fix the issues above before using Cline."
    exit 1
fi