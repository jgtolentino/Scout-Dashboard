
# InsightPulseAI Shorthand System

This folder documents the core shorthands used across InsightPulseAI operations for faster task execution and SKR syncing.

Includes: ext, ext link, skr, promptpulse.

## Tools and Utilities

### 🧹 SKR Dedupe
Compact SKR memory by removing redundant entries.

```bash
python scripts/skr_dedupe.py [--dry-run] [--threshold 0.85] [--no-backup]
```

### 🔗 Pointer Launch
Chain backup → semantic search → export flow in a single command.

```bash
# Full pipeline with search
scripts/pointer_launch.sh --all "your search query"

# Backup and deduplicate only
scripts/pointer_launch.sh --backup --dedupe

# Search only
scripts/pointer_launch.sh --search "your search query"
```

## Library Dependencies
The system uses the following libraries:

| Category            | Libraries Used |
|---------------------|----------------|
| **AI Model APIs**   | `openai`, `anthropic` |
| **Vector Search**   | `faiss-cpu` |
| **Data Processing** | `numpy`, `pandas`, `scikit-learn` |
| **Config Handling** | `python-dotenv`, `PyYAML` |
| **CLI Utilities**   | `click`, `rich`, `tqdm` |
| **Testing**         | `pytest` |
| **Visualization**   | `matplotlib` |
