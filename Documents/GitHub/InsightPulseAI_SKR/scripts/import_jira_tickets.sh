#!/bin/bash
# Jira CSV Import Instructions and Validation

echo "🎫 Jira Ticket Import Process"
echo "============================"

# Validate CSV format
CSV_FILE="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/docs/FILTER_SAFETY_JIRA_TICKETS.csv"

if [ ! -f "$CSV_FILE" ]; then
    echo "❌ CSV file not found: $CSV_FILE"
    exit 1
fi

# Check CSV format
echo "✅ Validating CSV format..."
HEADER_COUNT=$(head -1 "$CSV_FILE" | tr ',' '\n' | wc -l)
TOTAL_LINES=$(wc -l < "$CSV_FILE")

echo "   Headers: $HEADER_COUNT columns"
echo "   Total tickets: $((TOTAL_LINES - 1))"

# Show sample data
echo ""
echo "📋 Sample tickets:"
head -3 "$CSV_FILE" | column -t -s','

echo ""
echo "🔗 Jira Import Instructions:"
echo "1. Log into your Jira instance"
echo "2. Go to Projects → [Your Project] → Project Settings"
echo "3. Select 'Import' from the sidebar"
echo "4. Choose 'CSV Import'"
echo "5. Upload: $CSV_FILE"
echo "6. Map fields:"
echo "   - Summary → Summary"
echo "   - Issue Type → Issue Type"
echo "   - Priority → Priority"
echo "   - Story Points → Story Points"
echo "   - Description → Description"
echo "   - Labels → Labels"
echo "   - Components → Component/s"
echo "   - Epic → Epic Link"

echo ""
echo "⚙️ Jira Configuration Requirements:"
echo "- Epic 'Filter Safety Hardening' must exist"
echo "- Epic 'Filter Enhancement' must exist"
echo "- Components: FilterSystem, QueryBuilder, Analytics, Documentation"
echo "- Story Points field enabled"

echo ""
echo "📊 Import Summary:"
grep -c "Critical" "$CSV_FILE" | xargs echo "   Critical issues:"
grep -c "High" "$CSV_FILE" | xargs echo "   High priority:"
grep -c "Medium" "$CSV_FILE" | xargs echo "   Medium priority:"
grep -c "Bug" "$CSV_FILE" | xargs echo "   Bug fixes:"
grep -c "Security" "$CSV_FILE" | xargs echo "   Security issues:"
grep -c "Story" "$CSV_FILE" | xargs echo "   User stories:"

echo ""
echo "✅ CSV ready for Jira import!"
echo "📁 File location: $CSV_FILE"