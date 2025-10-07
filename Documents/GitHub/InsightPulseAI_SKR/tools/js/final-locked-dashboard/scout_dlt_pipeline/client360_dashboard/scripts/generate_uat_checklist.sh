#!/bin/bash
# UAT Checklist Generator
# This script extracts requirements from a PRD and generates a UAT checklist

set -e  # Exit on error

# Check for required arguments
if [ $# -lt 2 ]; then
  echo "Usage: $0 <prd_file> <output_file>"
  echo "Example: $0 my_feature_prd.md uat_checklist.md"
  exit 1
fi

PRD_FILE=$1
OUTPUT_FILE=$2
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEMP_FILE=$(mktemp)

# Check if PRD file exists
if [ ! -f "$PRD_FILE" ]; then
  echo "Error: PRD file '$PRD_FILE' not found"
  exit 1
fi

# Extract feature name from PRD
FEATURE_NAME=$(grep -m 1 "Feature Name:" "$PRD_FILE" | sed 's/.*Feature Name:[[:space:]]*\(.*\)[[:space:]]*$/\1/')
if [ -z "$FEATURE_NAME" ]; then
  FEATURE_NAME="Untitled Feature"
fi

# Generate UAT checklist header
cat > "$OUTPUT_FILE" << EOL
# UAT Checklist: $FEATURE_NAME

**Generated From:** $(basename "$PRD_FILE")  
**Generated On:** $(date)  
**PRD Reference:** $(realpath "$PRD_FILE")

## Instructions

1. For each requirement, verify that the deployed solution matches the PRD specifications
2. Mark each item as PASS, FAIL, or N/A
3. Include detailed notes for any FAIL or N/A items
4. Attach screenshots for visual verification
5. Complete all sections before signing off

## Functional Requirements Checklist

| ID | Requirement | Expected Result | Actual Result | Status | Notes |
|----|------------|-----------------|---------------|--------|-------|
EOL

# Extract functional requirements from the PRD
echo "Extracting functional requirements..."
grep -n "### Feature Requirements\|### Acceptance Criteria\|### Functional Requirements" "$PRD_FILE" > "$TEMP_FILE" || true

if [ -s "$TEMP_FILE" ]; then
  START_LINE=$(head -n 1 "$TEMP_FILE" | cut -d ':' -f 1)
  
  # Find the next section after requirements
  END_LINE=$(grep -n "^##" "$PRD_FILE" | awk -v start="$START_LINE" '$1 > start {print $1; exit}' | cut -d ':' -f 1)
  
  if [ -z "$END_LINE" ]; then
    # If no next section, extract until end of file
    END_LINE=$(wc -l "$PRD_FILE" | awk '{print $1}')
  fi
  
  # Extract requirements section
  sed -n "${START_LINE},${END_LINE}p" "$PRD_FILE" > "$TEMP_FILE"
  
  # Process requirements
  REQ_ID=1
  while read -r line; do
    # Look for list items that are likely requirements
    if [[ "$line" =~ ^[[:space:]]*[-\*]\ .*$ || "$line" =~ ^[[:space:]]*[0-9]+\.\ .*$ || "$line" =~ ^[[:space:]]*\[.\]\ .*$ ]]; then
      # Clean up the requirement text
      REQ_TEXT=$(echo "$line" | sed 's/^[[:space:]]*[-\*0-9\.\[\]x ]*//' | sed 's/[[:space:]]*$//')
      
      # Add to UAT checklist
      echo "| F$REQ_ID | $REQ_TEXT | | | PASS/FAIL/N/A | |" >> "$OUTPUT_FILE"
      REQ_ID=$((REQ_ID+1))
    fi
  done < "$TEMP_FILE"
fi

# Add UI/UX requirements section
cat >> "$OUTPUT_FILE" << EOL

## UI/UX Requirements Checklist

| ID | Requirement | Expected Result | Actual Result | Status | Notes |
|----|------------|-----------------|---------------|--------|-------|
EOL

# Extract UI/UX requirements
echo "Extracting UI/UX requirements..."
grep -n "### UI/UX Design\|### UI Requirements\|### UX Requirements\|### Design Requirements" "$PRD_FILE" > "$TEMP_FILE" || true

if [ -s "$TEMP_FILE" ]; then
  START_LINE=$(head -n 1 "$TEMP_FILE" | cut -d ':' -f 1)
  
  # Find the next section after UI/UX
  END_LINE=$(grep -n "^##" "$PRD_FILE" | awk -v start="$START_LINE" '$1 > start {print $1; exit}' | cut -d ':' -f 1)
  
  if [ -z "$END_LINE" ]; then
    # If no next section, extract until end of file
    END_LINE=$(wc -l "$PRD_FILE" | awk '{print $1}')
  fi
  
  # Extract UI/UX section
  sed -n "${START_LINE},${END_LINE}p" "$PRD_FILE" > "$TEMP_FILE"
  
  # Process UI/UX requirements
  REQ_ID=1
  while read -r line; do
    # Look for list items that are likely requirements
    if [[ "$line" =~ ^[[:space:]]*[-\*]\ .*$ || "$line" =~ ^[[:space:]]*[0-9]+\.\ .*$ || "$line" =~ ^[[:space:]]*\[.\]\ .*$ ]]; then
      # Clean up the requirement text
      REQ_TEXT=$(echo "$line" | sed 's/^[[:space:]]*[-\*0-9\.\[\]x ]*//' | sed 's/[[:space:]]*$//')
      
      # Add to UAT checklist
      echo "| U$REQ_ID | $REQ_TEXT | | | PASS/FAIL/N/A | |" >> "$OUTPUT_FILE"
      REQ_ID=$((REQ_ID+1))
    fi
  done < "$TEMP_FILE"
fi

# Add theme requirements section
cat >> "$OUTPUT_FILE" << EOL

## Theme Consistency Checklist

| ID | Requirement | Expected Result | Actual Result | Status | Notes |
|----|------------|-----------------|---------------|--------|-------|
| T1 | TBWA Navy color (#002B80) is used correctly | Brand colors match specification | | PASS/FAIL/N/A | |
| T2 | TBWA Cyan color (#00C3EC) is used correctly | Brand colors match specification | | PASS/FAIL/N/A | |
| T3 | Component styling matches TBWA design language | Styling is consistent | | PASS/FAIL/N/A | |
| T4 | Responsive layout works on all screen sizes | UI adapts appropriately | | PASS/FAIL/N/A | |
| T5 | All visual elements use correct brand styling | No style inconsistencies | | PASS/FAIL/N/A | |
EOL

# Add performance requirements section
cat >> "$OUTPUT_FILE" << EOL

## Performance Requirements Checklist

| ID | Requirement | Expected Result | Actual Result | Status | Notes |
|----|------------|-----------------|---------------|--------|-------|
| P1 | Page load time is acceptable | Load time < 3 seconds | | PASS/FAIL/N/A | |
| P2 | Interactive elements respond quickly | Response time < 300ms | | PASS/FAIL/N/A | |
| P3 | No visible performance degradation | Smooth operation | | PASS/FAIL/N/A | |
EOL

# Add visual verification section
cat >> "$OUTPUT_FILE" << EOL

## Visual Verification

| UI Element | Design Specification | Implementation | Match Status | Notes |
|------------|----------------------|----------------|--------------|-------|
| Layout | | | YES/NO/PARTIAL | |
| Colors | | | YES/NO/PARTIAL | |
| Typography | | | YES/NO/PARTIAL | |
| Components | | | YES/NO/PARTIAL | |
| Spacing | | | YES/NO/PARTIAL | |
| Responsive Behavior | | | YES/NO/PARTIAL | |

## Screenshots
[Include screenshots of the deployed solution for comparison with design]

## Sign-off

| Role | Name | Date | Status | Comments |
|------|------|------|--------|----------|
| Product Owner | | | APPROVED/NOT APPROVED | |
| QA Lead | | | APPROVED/NOT APPROVED | |
| Developer | | | APPROVED/NOT APPROVED | |
| End User Representative | | | APPROVED/NOT APPROVED | |

## Issues and Follow-up Actions

| ID | Issue | Severity | Assigned To | Due Date | Status |
|----|------|----------|-------------|----------|--------|
| | | | | | |
EOL

echo "UAT checklist generated: $OUTPUT_FILE"
echo "Next steps:"
echo "1. Review and customize the generated checklist"
echo "2. Complete the UAT with stakeholders"
echo "3. Document any issues in the issues section"
echo "4. Get sign-off from all required parties"

# Clean up
rm -f "$TEMP_FILE"