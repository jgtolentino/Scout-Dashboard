// vite_cache_config.js - Configuration for optimized Vite builds
const fs = require('fs');
const path = require('path');

/**
 * Adds caching configuration to a Vite config file
 * @param {string} configPath - Path to the vite.config.ts or vite.config.js file
 */
function addViteCacheConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    return false;
  }

  const configContent = fs.readFileSync(configPath, 'utf-8');
  
  // Check if cache configuration already exists
  if (configContent.includes('cacheDir:')) {
    console.log('✅ Cache configuration already exists');
    return true;
  }
  
  // Find insertion point (after defineConfig or near the top)
  let newContent;
  if (configContent.includes('defineConfig')) {
    newContent = configContent.replace(
      /defineConfig\(\s*{/,
      'defineConfig({\n  cacheDir: "./.vite-cache",'
    );
  } else {
    newContent = configContent.replace(
      /export default\s*{/,
      'export default {\n  cacheDir: "./.vite-cache",'
    );
  }
  
  if (newContent === configContent) {
    console.error('❌ Could not find insertion point in the config file');
    return false;
  }
  
  // Backup the original file
  const backupPath = `${configPath}.bak`;
  fs.writeFileSync(backupPath, configContent);
  
  // Write the new config
  fs.writeFileSync(configPath, newContent);
  
  console.log(`✅ Added cache configuration to ${configPath}`);
  console.log(`📝 Original config backed up to ${backupPath}`);
  
  return true;
}

/**
 * Creates a .gitignore entry for Vite cache
 */
function setupViteCacheGitignore() {
  const gitignorePath = path.resolve(process.cwd(), '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, '.vite-cache\n');
    console.log('✅ Created .gitignore with Vite cache entry');
    return true;
  }
  
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  
  if (gitignoreContent.includes('.vite-cache')) {
    console.log('✅ .vite-cache already in .gitignore');
    return true;
  }
  
  fs.appendFileSync(gitignorePath, '\n# Vite build cache\n.vite-cache\n');
  console.log('✅ Added .vite-cache to .gitignore');
  
  return true;
}

// If running directly
if (require.main === module) {
  const configPath = process.argv[2] || './vite.config.ts';
  addViteCacheConfig(configPath);
  setupViteCacheGitignore();
}

module.exports = {
  addViteCacheConfig,
  setupViteCacheGitignore
};