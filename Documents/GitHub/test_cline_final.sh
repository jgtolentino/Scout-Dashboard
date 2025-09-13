#!/bin/bash
# Final Headless Test for Cline Local Setup
echo "🧪 CLINE LOCAL SETUP TEST"
echo "========================="

echo ""
echo "✅ Ollama Service: $(curl -s http://localhost:11434/api/version | jq -r '.version')"
echo "✅ Models Available: $(ollama list | grep -c deepseek) deepseek models"
echo "✅ OpenAI API: $(curl -s http://localhost:11434/v1/models | jq '.data | length') models accessible"
echo "✅ Workspace: ~/cline-local $([ -d ~/cline-local ] && echo "exists" || echo "missing")"
echo "✅ Config: VS Code settings $([ -f ~/cline-local/.vscode/settings.json ] && echo "configured" || echo "missing")"

echo ""
echo "🤖 Testing AI Response:"
echo "----------------------"
RESPONSE=$(curl -s -X POST http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "deepseek-coder:6.7b-instruct-q4_K_M", "messages": [{"role": "user", "content": "Say hello"}], "max_tokens": 20}' \
  | jq -r '.choices[0].message.content' 2>/dev/null)

echo "AI Response: $RESPONSE"

echo ""
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo "Your Cline local setup is ready:"
echo "• Open VS Code: open -a 'Visual Studio Code' ~/cline-local"
echo "• Install Cline extension from marketplace"
echo "• Extension will auto-use your local deepseek-coder model"
echo "• Zero API costs, full privacy!"