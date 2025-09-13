#!/bin/bash

echo "======================================="
echo " Claude to Pulser Parity Diagnostic Tool"
echo " Pulser v1.1.1 | Claude CLI Emulation  "
echo "======================================="

PASS=0
FAIL=0
PARTIAL=0

function check() {
  local label="$1"
  local status="$2"
  case "$status" in
    pass) echo "✅  $label"; PASS=$((PASS+1));;
    fail) echo "❌  $label"; FAIL=$((FAIL+1));;
    partial) echo "⚠️  $label"; PARTIAL=$((PARTIAL+1));;
  esac
}

check "Run command alias (:claude-run)" pass
check "Chat shell command (:claude-chat)" pass
check "API toggle and validation" pass
check "Anthropic SDK connection" pass
check "Spinner + terminal feedback (ora style)" partial
check "Error fallback / exit codes" partial
check "Working directory context flag (--context)" fail
check "Claude-specific version flag (--version)" partial
check "Modular command registry structure" fail
check "Formal test suite (Jest or pytest)" fail

echo
echo "================= Summary ================="
echo "✅ Passed:   $PASS"
echo "⚠️  Partial:  $PARTIAL"
echo "❌ Failed:   $FAIL"
echo "==========================================="