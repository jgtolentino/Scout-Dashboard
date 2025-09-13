# Pulser Extension Test

## ✅ VS Code Relaunched

The Pulser extension with the new platypus icon has been installed.

## 🦫 Check for the Platypus Icon

1. Look at the **Activity Bar** (left sidebar)
2. You should see the platypus icon (blue square with white platypus head)
3. Click it to open the Pulser chat panel

## 🧪 Test the Extension

Try these commands:
1. Select some code
2. Right-click → "Explain Selected Code"
3. Or use the chat panel to ask questions

## 📝 Quick Test Code

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

Select the code above and right-click → "Explain Selected Code" to test the Pulser extension.

## 🔧 If Not Working

1. Check that Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. Open VS Code Settings (Cmd+,)
3. Search for "pulser"  
4. Verify the model is set to one you have installed

The extension is now using the InsightPulseAI platypus branding! 🦫