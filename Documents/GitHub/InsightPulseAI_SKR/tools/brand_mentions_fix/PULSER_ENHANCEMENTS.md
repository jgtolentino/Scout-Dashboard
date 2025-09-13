# Pulser CLI Enhancements

This package enhances the Pulser CLI with several UX improvements to make the tool more user-friendly and professional.

## Components

### 1. Enhanced Shell (`pulser_shell_enhancement.py`)

A complete replacement shell for Pulser CLI that provides:

- Mode-based operation (prompt, shell, and ops modes)
- Command prefixes for mixed operations
- Warning suppression with quiet mode
- Clear visual indicators for current context
- Better error handling for command/prompt confusion

### 2. Model Detection Utility (`pulser_run_model_detection.py`)

A utility that detects and improves the model loading experience:

- Filters out model loading noise
- Provides a spinner animation during model loading
- Shows progress information
- Hides common warnings (LibreSSL, deprecation warnings)

### 3. Installation Script (`install_pulser_enhancements.sh`)

Automates the installation process for the enhancements.

## Visual Examples

### Before Enhancement

```
pulser> az storage blob upload --account-name projectscoutdata
/Users/tbwa/pulser/pulser_infer_ollama.py:241: DeprecationWarning: ...LibreSSL...
warnings.warn(
Reloading model 'mistral'...
pulling manifest 
pulling ff82381e2bea... 100% ▕████████████████▏ 4.1 GB                         
pulling 43070e2d4e53... 100% ▕████████████████▏  11 KB                         
pulling 491dfa501e59... 100% ▕████████████████▏  801 B                         
pulling ed11eda7790d... 100% ▕████████████████▏   30 B                         
pulling 42347cd80dc8... 100% ▕████████████████▏  485 B                         
verifying sha256 digest 
writing manifest 
success 
Successfully pulled 'mistral'

I'm here to help! To upload a blob to Azure Storage, you'll need to provide more information...
```

### After Enhancement

```
pulser[🔵 prompt]> !az storage blob upload --account-name projectscoutdata
Uploading to projectscoutdata container...
Upload completed successfully.

pulser[🔵 prompt]> what is azure storage?
⠹ Loading mistral model... (1.2s)
✓ mistral model loaded successfully (4.3s)

🔵 Mistral: Azure Storage is Microsoft's cloud storage solution that provides...

pulser[🔵 prompt]> :quiet
Quiet mode enabled. Warnings and verbose output suppressed.

pulser[🔵 prompt]> ?mistral explain data lakes
🔵 Mistral: Data lakes are centralized repositories designed to store, process...
```

## Integration Architecture

```
┌───────────────┐     ┌────────────────────┐     ┌──────────────┐
│ Pulser Shell  │────▶│ Model Detection    │────▶│ Model APIs   │
│ Enhancement   │     │ (Spinner + Filter) │     │ (Ollama etc) │
└───────────────┘     └────────────────────┘     └──────────────┘
       │                                                │
       │                                                │
       ▼                                                ▼
┌────────────────┐                             ┌────────────────┐
│ Shell Commands │                             │ Filtered Model │
│ (Direct Exec)  │                             │ Responses      │
└────────────────┘                             └────────────────┘
```

## Installation

To install the enhancements:

```bash
# Clone the repository if you haven't already
git clone https://github.com/your-org/InsightPulseAI_SKR.git

# Navigate to the tool directory
cd InsightPulseAI_SKR/tools/brand_mentions_fix

# Run the installer
./install_pulser_enhancements.sh
```

## Usage

After installation, you can use the enhanced shell directly:

```bash
pulser-enhanced
```

Or add an alias to your shell configuration:

```bash
echo 'alias pulser="pulser-enhanced"' >> ~/.zshrc  # or ~/.bashrc
source ~/.zshrc  # or ~/.bashrc
```

## Key Commands

- `:quiet` - Enable quiet mode (hide warnings)
- `:verbose` - Show all output
- `:help` - Display help information
- `!command` - Run a shell command
- `?text` - Send a prompt to the default model
- `:model name` - Change the default model
- `:shell` - Switch to shell mode
- `:prompt` - Switch to prompt mode
- `:ops` - Switch to ops mode

## Technical Details

### Warning Suppression

Warnings are suppressed at multiple levels:

1. Python's warnings module
2. Environment variables
3. Subprocess stderr filtering
4. Output text filtering

### Model Loading Detection

The detection is based on pattern matching in command output:

- "Reloading model" indicates start of model loading
- "pulling manifest" confirms model loading in progress
- "success" or "Successfully pulled" indicates completion