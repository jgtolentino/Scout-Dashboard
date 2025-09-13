/**
 * ETL Schema Validator
 * 
 * Validates schema integrity across the ETL pipeline and integrates with Tide tracing.
 * 
 * Usage:
 *   node etl_schema_validator.js --schema-dir=dbt_project/models --baseline=schema_registry/baseline
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  schemaDir: process.argv.find(arg => arg.startsWith('--schema-dir=')).split('=')[1],
  baselineDir: process.argv.find(arg => arg.startsWith('--baseline=')).split('=')[1],
  outputFile: process.argv.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'schema_diff.json',
  tideTrace: process.argv.includes('--tide-trace'),
  traceId: process.argv.find(arg => arg.startsWith('--trace-id='))?.split('=')[1] || generateTraceId(),
  verbose: process.argv.includes('--verbose')
};

// Utility to generate trace ID if not provided
function generateTraceId() {
  return `etl-schema-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

// Log with timestamp
function log(message) {
  if (CONFIG.verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

// Generate schema fingerprints for a directory
function generateSchemaFingerprints(dir) {
  log(`Generating schema fingerprints for ${dir}`);
  
  const fingerprints = {};
  const modelFiles = findModelFiles(dir);
  
  modelFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const schemaName = path.basename(file, path.extname(file));
    
    // Extract schema definition (this is simplified - would need to be adapted for actual format)
    const schema = extractSchemaFromFile(content, path.extname(file));
    
    if (schema) {
      // Generate fingerprint using schema structure
      fingerprints[schemaName] = {
        path: file,
        fingerprint: crypto.createHash('sha256').update(JSON.stringify(schema)).digest('hex'),
        structure: schema,
        layer: determineLayer(file)
      };
    }
  });
  
  return fingerprints;
}

// Extract schema definition based on file type
function extractSchemaFromFile(content, extension) {
  switch (extension) {
    case '.sql':
      return extractSchemaFromSQL(content);
    case '.yml':
    case '.yaml':
      return extractSchemaFromYAML(content);
    case '.json':
      try {
        return JSON.parse(content);
      } catch (e) {
        log(`Error parsing JSON file: ${e.message}`);
        return null;
      }
    default:
      log(`Unsupported file extension: ${extension}`);
      return null;
  }
}

// Simplified SQL schema extraction - would need to be more sophisticated in production
function extractSchemaFromSQL(sql) {
  // This is a simplified example - would need proper SQL parsing
  const columns = [];
  const regex = /SELECT\s+([\s\S]*?)\s+FROM/i;
  const match = regex.exec(sql);
  
  if (match && match[1]) {
    const columnPart = match[1];
    const columnExpressions = columnPart.split(',').map(c => c.trim());
    
    columnExpressions.forEach(expr => {
      // Simple column alias detection
      const aliasMatch = /([^\s]+)\s+as\s+([^\s]+)/i.exec(expr);
      if (aliasMatch) {
        columns.push({
          name: aliasMatch[2],
          expression: aliasMatch[1]
        });
      } else if (!expr.includes('(')) {
        // Simple column without function
        columns.push({
          name: expr,
          expression: expr
        });
      }
    });
  }
  
  return { columns };
}

// Extract schema from YAML file
function extractSchemaFromYAML(yaml) {
  try {
    // Use built-in YAML parser if available
    const YAML = require('yaml');
    return YAML.parse(yaml);
  } catch (e) {
    // Fallback to command-line yaml2json if available
    try {
      const tmpFile = `/tmp/schema_${Date.now()}.yml`;
      fs.writeFileSync(tmpFile, yaml);
      const jsonOutput = execSync(`yaml2json ${tmpFile}`).toString();
      fs.unlinkSync(tmpFile);
      return JSON.parse(jsonOutput);
    } catch (err) {
      log(`Error parsing YAML: ${err.message}`);
      return null;
    }
  }
}

// Find all model files in directory
function findModelFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && 
                (entry.name.endsWith('.sql') || 
                 entry.name.endsWith('.yml') || 
                 entry.name.endsWith('.yaml') || 
                 entry.name.endsWith('.json'))) {
        files.push(fullPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}

// Determine which medallion layer a file belongs to
function determineLayer(filePath) {
  const normalizedPath = filePath.toLowerCase();
  
  if (normalizedPath.includes('/bronze/') || normalizedPath.includes('_bronze_')) {
    return 'bronze';
  } else if (normalizedPath.includes('/silver/') || normalizedPath.includes('_silver_')) {
    return 'silver';
  } else if (normalizedPath.includes('/gold/') || normalizedPath.includes('_gold_')) {
    return 'gold';
  } else {
    return 'unknown';
  }
}

// Compare schema fingerprints
function compareSchemaFingerprints(current, baseline) {
  log('Comparing schema fingerprints');
  
  const results = {
    added: [],
    removed: [],
    modified: [],
    unchanged: [],
    details: {}
  };
  
  // Find added models
  Object.keys(current).forEach(model => {
    if (!baseline[model]) {
      results.added.push(model);
      results.details[model] = {
        status: 'added',
        layer: current[model].layer
      };
    }
  });
  
  // Find removed and changed models
  Object.keys(baseline).forEach(model => {
    if (!current[model]) {
      results.removed.push(model);
      results.details[model] = {
        status: 'removed',
        layer: baseline[model].layer
      };
    } else if (current[model].fingerprint !== baseline[model].fingerprint) {
      results.modified.push(model);
      
      // Calculate detailed differences
      const differences = findSchemaDifferences(
        baseline[model].structure, 
        current[model].structure
      );
      
      results.details[model] = {
        status: 'modified',
        layer: current[model].layer,
        differences
      };
    } else {
      results.unchanged.push(model);
      results.details[model] = {
        status: 'unchanged',
        layer: current[model].layer
      };
    }
  });
  
  return results;
}

// Find detailed differences between schemas
function findSchemaDifferences(baseline, current) {
  // This is a simplified implementation - would need more sophisticated diffing in production
  const differences = {
    columns: {
      added: [],
      removed: [],
      modified: []
    }
  };
  
  // Compare columns if they exist
  if (baseline.columns && current.columns) {
    const baselineColumns = new Map(baseline.columns.map(col => [col.name, col]));
    const currentColumns = new Map(current.columns.map(col => [col.name, col]));
    
    // Find added columns
    currentColumns.forEach((col, name) => {
      if (!baselineColumns.has(name)) {
        differences.columns.added.push(name);
      } else if (JSON.stringify(col) !== JSON.stringify(baselineColumns.get(name))) {
        differences.columns.modified.push(name);
      }
    });
    
    // Find removed columns
    baselineColumns.forEach((col, name) => {
      if (!currentColumns.has(name)) {
        differences.columns.removed.push(name);
      }
    });
  }
  
  return differences;
}

// Record schema validation in Tide tracing system
function recordTideTrace(results) {
  log(`Recording schema validation in Tide (Trace ID: ${CONFIG.traceId})`);
  
  const traceData = {
    trace_id: CONFIG.traceId,
    operation: 'schema_validation',
    timestamp: new Date().toISOString(),
    status: results.modified.length > 0 || results.removed.length > 0 ? 'SCHEMA_CHANGED' : 'SCHEMA_STABLE',
    components: {
      bronze: results.details.filter(d => d.layer === 'bronze').length,
      silver: results.details.filter(d => d.layer === 'silver').length,
      gold: results.details.filter(d => d.layer === 'gold').length
    },
    metrics: {
      added_count: results.added.length,
      removed_count: results.removed.length,
      modified_count: results.modified.length,
      unchanged_count: results.unchanged.length,
      total_models: Object.keys(results.details).length
    },
    details: results
  };
  
  // Write trace data to file
  const traceFile = `tide_trace_${CONFIG.traceId}.json`;
  fs.writeFileSync(traceFile, JSON.stringify(traceData, null, 2));
  
  // In a real implementation, you would integrate with your tracing API
  log(`Trace data written to ${traceFile}`);
  
  return traceData;
}

// Main execution
function main() {
  log('Starting ETL Schema Validator');
  
  // Generate fingerprints
  const currentFingerprints = generateSchemaFingerprints(CONFIG.schemaDir);
  const baselineFingerprints = generateSchemaFingerprints(CONFIG.baselineDir);
  
  // Compare fingerprints
  const results = compareSchemaFingerprints(currentFingerprints, baselineFingerprints);
  
  // Record in Tide if enabled
  let traceData = null;
  if (CONFIG.tideTrace) {
    traceData = recordTideTrace(results);
  }
  
  // Add summary
  results.summary = {
    added_count: results.added.length,
    removed_count: results.removed.length,
    modified_count: results.modified.length,
    unchanged_count: results.unchanged.length,
    total_models: Object.keys(results.details).length,
    status: results.modified.length > 0 || results.removed.length > 0 ? 'SCHEMA_CHANGED' : 'SCHEMA_STABLE',
    timestamp: new Date().toISOString()
  };
  
  if (traceData) {
    results.trace_id = traceData.trace_id;
  }
  
  // Write results
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(results, null, 2));
  log(`Schema validation complete. Results written to ${CONFIG.outputFile}`);
  
  // Output for CI/CD pipeline
  console.log(JSON.stringify({
    added: results.added.length,
    removed: results.removed.length,
    modified: results.modified.length,
    unchanged: results.unchanged.length,
    status: results.summary.status
  }));
  
  // Return non-zero exit code if schemas changed and we're in strict mode
  if (process.argv.includes('--strict') && (results.modified.length > 0 || results.removed.length > 0)) {
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

// Export for use as a module
module.exports = {
  generateSchemaFingerprints,
  compareSchemaFingerprints,
  findSchemaDifferences,
  recordTideTrace
};