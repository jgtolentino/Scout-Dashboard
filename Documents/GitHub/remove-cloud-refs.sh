#!/bin/bash
# Script to remove cloud API references
# Run with caution - creates backups first

echo "🔍 Scanning for cloud API references..."
echo ""

# Create backup directory
BACKUP_DIR=".cloud-refs-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📁 Created backup directory: $BACKUP_DIR"
echo ""

# Find files with cloud references
FILES=$(grep -r "apiKey\|api_key\|ANTHROPIC\|OPENAI\|AZURE\|CLAUDE" \
    --include="*.ts" \
    --include="*.js" \
    --include="*.json" \
    --include="*.yaml" \
    --include="*.yml" \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude="README*" \
    . 2>/dev/null | cut -d: -f1 | sort -u)

if [ -z "$FILES" ]; then
    echo "✅ No cloud API references found!"
    exit 0
fi

echo "Found $(echo "$FILES" | wc -l) files with potential cloud references:"
echo "$FILES" | sed 's/^/  • /'
echo ""

read -p "🤔 Do you want to backup and clean these files? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 1
fi

# Backup and clean files
for FILE in $FILES; do
    # Skip if file doesn't exist
    [ ! -f "$FILE" ] && continue
    
    # Create backup
    cp "$FILE" "$BACKUP_DIR/$(basename "$FILE").backup"
    
    # Remove specific patterns
    sed -i.tmp \
        -e '/apiKey.*=.*["\x27][^"\x27]*["\x27]/d' \
        -e '/api_key.*=.*["\x27][^"\x27]*["\x27]/d' \
        -e '/ANTHROPIC_API_KEY/d' \
        -e '/OPENAI_API_KEY/d' \
        -e '/CLAUDE_API_KEY/d' \
        -e '/AZURE.*KEY/d' \
        -e '/AZURE.*TOKEN/d' \
        "$FILE"
    
    # Remove temp files
    rm -f "$FILE.tmp"
    
    echo "  ✓ Cleaned: $FILE"
done

echo ""
echo "✅ Cloud references removed!"
echo "📁 Backups saved in: $BACKUP_DIR"
echo ""
echo "⚠️  Please review changes and test your application"