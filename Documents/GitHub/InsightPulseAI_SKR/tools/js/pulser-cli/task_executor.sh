#!/bin/bash
# Wraps commands routed via Claude or Pulser
set -e
echo "[Pulser] Executing task: $@" | tee -a claude_session.log
eval "$@"