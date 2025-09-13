# CLI Error Handling Guide

For Pulser / Claude Code CLI / Any AI-augmented Terminal

## 🔧 1. read: invalid timeout specification

- **Cause**: Non-integer or misformatted -t value in read.
- **How AI should handle**:
  - Detect shell type (bash, zsh, sh) and adapt timeout accordingly.
  - Offer cross-platform fallback logic:

```bash
if [[ "$OSTYPE" == "darwin"* ]]; then
  read -r -n 1 -t 1 || echo "No input after 1s"
else
  read -t 0.5 -n 1 ...
fi
```

- **Display**: ⚠️ Adjusting read timeout based on shell compatibility.

## 🔧 2. Input contains non-printable characters

- **Cause**: User pasted styled text or corrupted encoding.
- **How AI should handle**:
  - Clean using: `tr -cd '\11\12\15\40-\176'`
  - Echo back sanitized version and ask:

```
Your input had non-printable characters. Here's a cleaned version: "[...]" — proceed with this? (Y/n)
```

## 🔧 3. command not found

- **Cause**: Missing binary or mistyped command.
- **How AI should handle**:
  - Search $PATH and suggest likely candidates.
  - Offer install guidance:

```bash
brew install [tool]  # on macOS
apt install [tool]   # on Debian/Ubuntu
```

- **Display**: ❌ Command not found: did you mean 'curl' instead of 'crul'?

## 🔧 4. Permission denied

- **Cause**: Missing execution rights.
- **How AI should handle**:
  - Run chmod +x file automatically.
  - Retry execution after applying fix.
  - Display: 🔐 File wasn't executable — permissions fixed. Retrying...

## 🔧 5. timeout: command not found

- **Cause**: timeout is not native to some shells (macOS lacks GNU timeout).
- **How AI should handle**:
  - Use a fallback: perl, expect, or manually time it with sleep + kill.
  - Offer to install coreutils if on macOS:

```bash
brew install coreutils
```

## 🔧 6. zsh: no matches found

- **Cause**: Glob pattern without escape.
- **How AI should handle**:
  - Escape *, ?, or [] unless explicitly allowed.
  - Suggest quoting or adding noglob temporarily.

## 🔧 7. Segmentation fault or core dumped

- **Cause**: Crashing binary.
- **How AI should handle**:
  - Detect and log crash metadata.
  - Suggest running under gdb or collecting backtrace.
  - Display: 💥 Crash detected. Memory snapshot saved to crash.log.

## 🔧 8. Syntax error: unexpected token

- **Cause**: Shell script or input format mistake.
- **How AI should handle**:
  - Re-parse last input as if it's a command.
  - Suggest correct format based on past patterns.

## 🔧 9. Timed out after X seconds of inactivity

- **Cause**: User didn't respond or script hung.
- **How AI should handle**:
  - Notify clearly: ⏱️ Session inactive for 30s. Timing out to prevent hang.
  - Optionally prompt: "Would you like to resume the previous task?"

## 🔧 10. Exit code != 0

- **Cause**: Silent or unexpected script failure.
- **How AI should handle**:
  - Interpret return codes:
    - 1: General error
    - 2: Misuse of shell builtins
    - 126: Command invoked cannot execute
    - 127: Command not found
    - 130: Script terminated by Ctrl+C
  - Display annotated error like:

```
🚨 Exit Code: 127 — Command not found
Suggested Fix: Check spelling or install missing binary.
```

## 🧠 Add-On: AI Fault Tolerance Design

Claude Code / Pulser should maintain:
- `~/.pulser_history` log of last 50 inputs + responses
- `:diagnose` mode to show:
  - Shell type
  - $PATH
  - Missing tools
- `:fix` mode that:
  - Tries permission corrections
  - Suggests brew/apt install
  - Adds . ~/.zshrc if env is unsourced