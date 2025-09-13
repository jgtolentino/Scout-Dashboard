#!/bin/bash
# qa_check.sh - Trigger Caca QA for Advisor Dashboard
# This script provides a CLI interface to run the Caca QA workflow

set -e

# Configuration
VERSION="${1:-v1.0.0}"
TARGET="${2:-advisor}"
REPO_ROOT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
QA_CORE_PATH="${REPO_ROOT}/qa-caca-core"
QA_REPORTS_PATH="${REPO_ROOT}/qa_reports/${TARGET}-${VERSION}"
TARGET_PATH="${REPO_ROOT}/deploy-ready/${TARGET}"
PRD_PATH="${REPO_ROOT}/docs/README_PRD_${TARGET^^}.md"

# Header
echo "🧪 Caca QA Verification - ${TARGET} v${VERSION}"
echo "======================================================="

# Check if we're in a GitHub Actions environment
if [ -n "$GITHUB_ACTIONS" ]; then
    echo "Running in GitHub Actions environment"
    # Use GitHub Actions command to run QA
    echo "::group::Running QA Verification"
    node "${QA_CORE_PATH}/qa/scripts/validate_ui.js" "${TARGET_PATH}"
    
    # Use ts-node if available, otherwise compile and run
    if command -v ts-node &> /dev/null; then
        ts-node "${QA_CORE_PATH}/qa/scripts/compare_prd.ts" "${PRD_PATH}" "${TARGET_PATH}"
    else
        tsc "${QA_CORE_PATH}/qa/scripts/compare_prd.ts" --outDir "${QA_CORE_PATH}/qa/scripts/dist"
        node "${QA_CORE_PATH}/qa/scripts/dist/compare_prd.js" "${PRD_PATH}" "${TARGET_PATH}"
    fi
    
    mkdir -p "${QA_REPORTS_PATH}"
    cp qa/tmp/report.yaml "${QA_REPORTS_PATH}/qa_report.yaml"
    echo "::endgroup::"
else
    # Local execution
    echo "Running local QA verification"
    
    # Check dependencies
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is required but not installed"
        exit 1
    fi
    
    # Create directories
    mkdir -p "${QA_CORE_PATH}/qa/tmp"
    mkdir -p "${QA_CORE_PATH}/qa/snapshots"
    mkdir -p "${QA_REPORTS_PATH}"
    
    # Run QA validation
    echo "📸 Running UI validation..."
    node "${QA_CORE_PATH}/qa/scripts/validate_ui.js" "${TARGET_PATH}"
    
    echo "🔍 Comparing with PRD..."
    if command -v ts-node &> /dev/null; then
        ts-node "${QA_CORE_PATH}/qa/scripts/compare_prd.ts" "${PRD_PATH}" "${TARGET_PATH}"
    else
        echo "⚠️ ts-node not found, using fallback comparison method"
        # Simple fallback if TypeScript isn't available
        node -e "
            const fs = require('fs');
            const yaml = require('js-yaml');
            
            try {
                // Try to read PRD
                const prdPath = '${PRD_PATH}';
                let prd = {};
                if (fs.existsSync(prdPath)) {
                    const content = fs.readFileSync(prdPath, 'utf8');
                    // Look for YAML blocks
                    const yamlMatch = content.match(/\`\`\`yaml([\\s\\S]*?)\`\`\`/);
                    if (yamlMatch) {
                        prd = yaml.load(yamlMatch[1]);
                    }
                } else {
                    console.log('⚠️ PRD file not found, using defaults');
                    prd = { title: '${TARGET} Dashboard' };
                }
                
                // Read HTML
                const htmlPath = '${TARGET_PATH}/index.html';
                let html = '';
                if (fs.existsSync(htmlPath)) {
                    html = fs.readFileSync(htmlPath, 'utf8');
                } else {
                    console.log('⚠️ HTML index file not found');
                }
                
                // Simple checks
                const results = {
                    prdTitleMatch: html.includes(prd.title || '${TARGET}'),
                    hasFilterBar: html.includes('filter'),
                    hasKpis: html.includes('KPI'),
                };
                
                // Save results
                fs.mkdirSync('${QA_CORE_PATH}/qa/tmp', { recursive: true });
                fs.writeFileSync('${QA_CORE_PATH}/qa/tmp/report.yaml', yaml.dump(results));
                console.log('✅ Basic PRD comparison complete');
            } catch (err) {
                console.error('❌ Error:', err.message);
                process.exit(1);
            }
        "
    fi
    
    # Copy report to output location
    cp "${QA_CORE_PATH}/qa/tmp/report.yaml" "${QA_REPORTS_PATH}/qa_report.yaml"
fi

# Display results
echo -e "\n📋 QA Results"
echo "======================================================="

if [ -f "${QA_REPORTS_PATH}/qa_report.yaml" ]; then
    cat "${QA_REPORTS_PATH}/qa_report.yaml"
    echo -e "\n✅ QA report saved to: ${QA_REPORTS_PATH}/qa_report.yaml"
    
    # Check if any test failed
    if grep -q "false" "${QA_REPORTS_PATH}/qa_report.yaml"; then
        echo -e "\n❌ QA verification FAILED"
        exit 1
    else
        echo -e "\n✅ QA verification PASSED"
    fi
else
    echo "❌ QA report not generated"
    exit 1
fi

echo -e "\n📸 Screenshots saved to: ${QA_CORE_PATH}/qa/snapshots/"
echo "======================================================="