/**
 * Snow White - White-Labeling & Rebranding Agent
 * 
 * Handles conversion of internal references to client-facing aliases
 * and manages the white-labeling process for client deliverables.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration
const CONFIG_DIR = path.resolve(__dirname, '../client-facing');
const DEFAULT_ALIAS_MAP_PATH = path.resolve(CONFIG_DIR, 'alias_map.yaml');
const LICENSE_TEMPLATE_PATH = path.resolve(CONFIG_DIR, 'LICENSE.txt');
const NOTICE_TEMPLATE_PATH = path.resolve(CONFIG_DIR, 'NOTICE.md');

/**
 * Snow White Agent - White-Labeling & Rebranding
 */
class SnowWhiteAgent {
  constructor(options = {}) {
    this.aliasMapPath = options.aliasMapPath || DEFAULT_ALIAS_MAP_PATH;
    this.aliasMap = this.loadAliasMap();
    this.verboseMode = options.verbose || false;
    
    // Ensure directories exist
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  /**
   * Load alias mapping from YAML file
   */
  loadAliasMap() {
    try {
      if (fs.existsSync(this.aliasMapPath)) {
        const aliasMapContent = fs.readFileSync(this.aliasMapPath, 'utf8');
        return yaml.load(aliasMapContent) || {};
      }
      
      // If file doesn't exist, create with default mappings
      const defaultMap = {
        agents: {
          "InsightPulseAI": "CLIENT_SYSTEM",
          "Pulser": "Analytics Core",
          "Claudia": "TaskRouter",
          "Kalaw": "KnowledgeBase",
          "Echo": "SignalExtractor",
          "Maya": "DocumentManager",
          "Caca": "QualityValidator",
          "Sunnies": "Visualizer"
        },
        terms: {
          "medallion architecture": "data processing framework",
          "bronze layer": "raw data layer",
          "silver layer": "processed data layer",
          "gold layer": "analytics layer",
          "platinum layer": "insights layer",
          "SKR": "Knowledge Repository",
          "Juicer": "Insights Engine"
        }
      };
      
      fs.writeFileSync(this.aliasMapPath, yaml.dump(defaultMap), 'utf8');
      return defaultMap;
    } catch (error) {
      console.error(chalk.red(`Error loading alias map: ${error.message}`));
      return {};
    }
  }

  /**
   * Save alias mapping to YAML file
   */
  saveAliasMap() {
    try {
      fs.writeFileSync(this.aliasMapPath, yaml.dump(this.aliasMap), 'utf8');
      if (this.verboseMode) {
        console.log(chalk.green(`Alias map saved to ${this.aliasMapPath}`));
      }
    } catch (error) {
      console.error(chalk.red(`Error saving alias map: ${error.message}`));
    }
  }

  /**
   * Update alias mapping with new entry
   */
  updateAlias(category, internalName, clientName) {
    if (!this.aliasMap[category]) {
      this.aliasMap[category] = {};
    }
    
    this.aliasMap[category][internalName] = clientName;
    this.saveAliasMap();
    
    console.log(chalk.green(`Updated alias: ${internalName} → ${clientName} in category '${category}'`));
  }

  /**
   * Apply white-labeling to a string
   */
  applyWhitelabeling(content) {
    let whitelabeledContent = content;
    
    // Apply agent aliases
    if (this.aliasMap.agents) {
      Object.entries(this.aliasMap.agents).forEach(([internalName, clientName]) => {
        const regex = new RegExp(`\\b${internalName}\\b`, 'g');
        whitelabeledContent = whitelabeledContent.replace(regex, clientName);
      });
    }
    
    // Apply terminology aliases
    if (this.aliasMap.terms) {
      Object.entries(this.aliasMap.terms).forEach(([internalTerm, clientTerm]) => {
        const regex = new RegExp(`\\b${internalTerm}\\b`, 'gi');
        whitelabeledContent = whitelabeledContent.replace(regex, clientTerm);
      });
    }
    
    return whitelabeledContent;
  }

  /**
   * White-label a single file
   */
  whitelabelFile(filePath, outputPath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Read original file
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Apply white-labeling
      const whitelabeledContent = this.applyWhitelabeling(content);
      
      // Write to output path
      fs.writeFileSync(outputPath, whitelabeledContent, 'utf8');
      
      if (this.verboseMode) {
        console.log(chalk.green(`White-labeled ${filePath} to ${outputPath}`));
      }
      
      return true;
    } catch (error) {
      console.error(chalk.red(`Error white-labeling file ${filePath}: ${error.message}`));
      return false;
    }
  }

  /**
   * White-label a directory of files
   */
  whitelabelDirectory(sourceDir, targetDir, options = {}) {
    const skipPatterns = options.skip || ['.git', 'node_modules'];
    const fileExts = options.extensions || ['.md', '.js', '.py', '.sql', '.json', '.yaml', '.yml', '.html'];
    
    try {
      if (!fs.existsSync(sourceDir)) {
        throw new Error(`Source directory not found: ${sourceDir}`);
      }
      
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Get list of files and directories
      const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
      
      // Process each entry
      let processedCount = 0;
      let errorCount = 0;
      
      for (const entry of entries) {
        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);
        
        // Skip patterns
        if (skipPatterns.includes(entry.name)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          // Recursively process subdirectory
          const result = this.whitelabelDirectory(sourcePath, targetPath, options);
          processedCount += result.processed;
          errorCount += result.errors;
        } else if (entry.isFile()) {
          // Process file if extension matches
          const ext = path.extname(entry.name).toLowerCase();
          if (fileExts.includes(ext)) {
            const success = this.whitelabelFile(sourcePath, targetPath);
            if (success) {
              processedCount++;
            } else {
              errorCount++;
            }
          } else {
            // Just copy the file without processing
            fs.copyFileSync(sourcePath, targetPath);
            processedCount++;
          }
        }
      }
      
      return { processed: processedCount, errors: errorCount };
    } catch (error) {
      console.error(chalk.red(`Error white-labeling directory ${sourceDir}: ${error.message}`));
      return { processed: 0, errors: 1 };
    }
  }

  /**
   * Scrub metadata from a file
   */
  scrubMetadata(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const ext = path.extname(filePath).toLowerCase();
      
      // Different handling based on file type
      if (ext === '.json' || ext === '.yaml' || ext === '.yml') {
        // Parse structured data
        let data;
        if (ext === '.json') {
          data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else {
          data = yaml.load(fs.readFileSync(filePath, 'utf8'));
        }
        
        // Remove sensitive fields
        const fieldsToRemove = ['author', 'created_by', 'agent', 'internal_id', 'metadata', 'debug_info'];
        
        const scrubObject = (obj) => {
          if (!obj || typeof obj !== 'object') return obj;
          
          for (const field of fieldsToRemove) {
            if (obj.hasOwnProperty(field)) {
              delete obj[field];
            }
          }
          
          // Recursively process nested objects
          for (const key in obj) {
            if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
              obj[key] = scrubObject(obj[key]);
            }
          }
          
          return obj;
        };
        
        // Scrub data
        data = scrubObject(data);
        
        // Write back to file
        if (ext === '.json') {
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        } else {
          fs.writeFileSync(filePath, yaml.dump(data), 'utf8');
        }
      } else {
        // Text files - remove common metadata patterns
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove authorship and agent references
        content = content.replace(/Author:\s*.*$/gm, '');
        content = content.replace(/Created by:\s*.*$/gm, '');
        content = content.replace(/Generated by:\s*.*$/gm, '');
        content = content.replace(/\bAgent:\s*\w+\b/g, '');
        
        // Remove internal IDs
        content = content.replace(/[A-Z]+-\d{4}-\d{8}-\d{6}/g, '[ID]');
        
        // Write back to file
        fs.writeFileSync(filePath, content, 'utf8');
      }
      
      if (this.verboseMode) {
        console.log(chalk.green(`Scrubbed metadata from ${filePath}`));
      }
      
      return true;
    } catch (error) {
      console.error(chalk.red(`Error scrubbing metadata from ${filePath}: ${error.message}`));
      return false;
    }
  }

  /**
   * Deploy white-labeled resources to client-facing repository
   */
  deployToClient(clientName, sourceDir, outputDir, options = {}) {
    console.log(chalk.blue(`Starting white-labeling for client: ${clientName}`));
    
    try {
      // 1. White-label the content
      const result = this.whitelabelDirectory(sourceDir, outputDir, options);
      
      // 2. Add license files
      this.addLicenseFiles(outputDir, clientName);
      
      // 3. Scrub metadata
      this.scrubDirectoryMetadata(outputDir);
      
      // 4. Summary
      console.log(chalk.green(`
White-labeling for ${clientName} complete:
- Files processed: ${result.processed}
- Errors: ${result.errors}
- Output directory: ${outputDir}
      `));
      
      return { success: true, ...result };
    } catch (error) {
      console.error(chalk.red(`Error during client deployment: ${error.message}`));
      return { success: false, processed: 0, errors: 1 };
    }
  }

  /**
   * Add license and notice files to the client-facing output
   */
  addLicenseFiles(outputDir, clientName) {
    try {
      // Add LICENSE.txt
      if (fs.existsSync(LICENSE_TEMPLATE_PATH)) {
        let licenseContent = fs.readFileSync(LICENSE_TEMPLATE_PATH, 'utf8');
        licenseContent = licenseContent.replace(/\{CLIENT_NAME\}/g, clientName);
        licenseContent = licenseContent.replace(/\{YEAR\}/g, new Date().getFullYear());
        fs.writeFileSync(path.join(outputDir, 'LICENSE.txt'), licenseContent, 'utf8');
      }
      
      // Add NOTICE.md
      if (fs.existsSync(NOTICE_TEMPLATE_PATH)) {
        let noticeContent = fs.readFileSync(NOTICE_TEMPLATE_PATH, 'utf8');
        noticeContent = noticeContent.replace(/\{CLIENT_NAME\}/g, clientName);
        noticeContent = noticeContent.replace(/\{YEAR\}/g, new Date().getFullYear());
        noticeContent = noticeContent.replace(/\{DATE\}/g, new Date().toISOString().split('T')[0]);
        fs.writeFileSync(path.join(outputDir, 'NOTICE.md'), noticeContent, 'utf8');
      }
      
      if (this.verboseMode) {
        console.log(chalk.green('Added license files to output directory'));
      }
    } catch (error) {
      console.error(chalk.red(`Error adding license files: ${error.message}`));
    }
  }

  /**
   * Scrub metadata from all files in a directory
   */
  scrubDirectoryMetadata(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        this.scrubDirectoryMetadata(fullPath);
      } else if (entry.isFile()) {
        this.scrubMetadata(fullPath);
      }
    }
  }

  /**
   * Check directory for non-compliant internal references
   */
  checkForInternalReferences(directory) {
    console.log(chalk.blue(`Checking for internal references in: ${directory}`));
    
    const results = {
      total: 0,
      files: {},
      terms: {}
    };
    
    const checkContent = (filePath, content) => {
      let fileResults = {};
      
      // Check for agent names
      if (this.aliasMap.agents) {
        for (const [internalName, clientName] of Object.entries(this.aliasMap.agents)) {
          const regex = new RegExp(`\\b${internalName}\\b`, 'g');
          const matches = content.match(regex) || [];
          
          if (matches.length > 0) {
            if (!fileResults[internalName]) {
              fileResults[internalName] = 0;
            }
            fileResults[internalName] += matches.length;
            
            if (!results.terms[internalName]) {
              results.terms[internalName] = 0;
            }
            results.terms[internalName] += matches.length;
          }
        }
      }
      
      // Check for terms
      if (this.aliasMap.terms) {
        for (const [internalTerm, clientTerm] of Object.entries(this.aliasMap.terms)) {
          const regex = new RegExp(`\\b${internalTerm}\\b`, 'gi');
          const matches = content.match(regex) || [];
          
          if (matches.length > 0) {
            if (!fileResults[internalTerm]) {
              fileResults[internalTerm] = 0;
            }
            fileResults[internalTerm] += matches.length;
            
            if (!results.terms[internalTerm]) {
              results.terms[internalTerm] = 0;
            }
            results.terms[internalTerm] += matches.length;
          }
        }
      }
      
      // If file has results, add to overall results
      if (Object.keys(fileResults).length > 0) {
        results.files[filePath] = fileResults;
        results.total += Object.values(fileResults).reduce((sum, count) => sum + count, 0);
      }
    };
    
    const walkDirectory = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip certain directories and files
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
          continue;
        }
        
        if (entry.isDirectory()) {
          walkDirectory(fullPath);
        } else if (entry.isFile()) {
          // Skip binary files or very large files
          const stats = fs.statSync(fullPath);
          if (stats.size > 5 * 1024 * 1024) { // Skip files larger than 5MB
            continue;
          }
          
          try {
            const ext = path.extname(entry.name).toLowerCase();
            const textFileExts = ['.md', '.txt', '.js', '.py', '.html', '.css', '.sql', '.yaml', '.yml', '.json'];
            
            if (textFileExts.includes(ext)) {
              const content = fs.readFileSync(fullPath, 'utf8');
              checkContent(fullPath, content);
            }
          } catch (error) {
            // Skip files that can't be read
            console.log(chalk.yellow(`Skipping file ${fullPath}: ${error.message}`));
          }
        }
      }
    };
    
    // Start checking
    walkDirectory(directory);
    
    // Display results
    if (results.total > 0) {
      console.log(chalk.yellow(`Found ${results.total} internal references in ${Object.keys(results.files).length} files`));
      
      console.log(chalk.yellow('\nTerms found:'));
      for (const [term, count] of Object.entries(results.terms)) {
        console.log(chalk.yellow(`  - ${term}: ${count} occurrences`));
      }
      
      console.log(chalk.yellow('\nFiles with internal references:'));
      for (const [filePath, terms] of Object.entries(results.files)) {
        console.log(chalk.yellow(`  - ${filePath}:`));
        for (const [term, count] of Object.entries(terms)) {
          console.log(chalk.yellow(`      - ${term}: ${count} occurrences`));
        }
      }
    } else {
      console.log(chalk.green('No internal references found'));
    }
    
    return results;
  }
}

module.exports = SnowWhiteAgent;