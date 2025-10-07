const fs = require('fs');
const yaml = require('js-yaml');

// Load the alias mapping
const aliasMapPath = '/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/client-facing/alias_map.yaml';
const aliasMapContent = fs.readFileSync(aliasMapPath, 'utf8');
const aliasMap = yaml.load(aliasMapContent);

// Load the source file
const sourceFile = '/tmp/medallion_alignment_original.md';
const sourceContent = fs.readFileSync(sourceFile, 'utf8');

// Apply white-labeling
function applyWhiteLabeling(content) {
  let whitelabeledContent = content;
  
  // Apply agent aliases
  if (aliasMap.agent_aliases) {
    for (const [internalName, clientName] of Object.entries(aliasMap.agent_aliases)) {
      const regex = new RegExp(`\\b${internalName}\\b`, 'g');
      whitelabeledContent = whitelabeledContent.replace(regex, clientName);
    }
  }
  
  // Apply terminology replacements
  if (aliasMap.terminology) {
    for (const [internalTerm, clientTerm] of Object.entries(aliasMap.terminology)) {
      const regex = new RegExp(`\\b${internalTerm}\\b`, 'gi');
      whitelabeledContent = whitelabeledContent.replace(regex, clientTerm);
    }
  }
  
  return whitelabeledContent;
}

// Process the file
const whitelabeledContent = applyWhiteLabeling(sourceContent);

// Write the white-labeled content to a new file
const targetFile = '/tmp/medallion_alignment_whitelabeled.md';
fs.writeFileSync(targetFile, whitelabeledContent, 'utf8');

console.log('Original file: ' + sourceFile);
console.log('White-labeled file: ' + targetFile);

// Print a diff summary
const diffSummary = [];
if (aliasMap.agent_aliases) {
  for (const [internalName, clientName] of Object.entries(aliasMap.agent_aliases)) {
    const regex = new RegExp(`\\b${internalName}\\b`, 'g');
    const matches = sourceContent.match(regex);
    if (matches && matches.length > 0) {
      diffSummary.push(`- ${internalName} → ${clientName} (${matches.length} occurrences)`);
    }
  }
}

if (aliasMap.terminology) {
  for (const [internalTerm, clientTerm] of Object.entries(aliasMap.terminology)) {
    const regex = new RegExp(`\\b${internalTerm}\\b`, 'gi');
    const matches = sourceContent.match(regex);
    if (matches && matches.length > 0) {
      diffSummary.push(`- "${internalTerm}" → "${clientTerm}" (${matches.length} occurrences)`);
    }
  }
}

console.log('\nChanges made:');
if (diffSummary.length > 0) {
  console.log(diffSummary.join('\n'));
} else {
  console.log('No changes were made.');
}