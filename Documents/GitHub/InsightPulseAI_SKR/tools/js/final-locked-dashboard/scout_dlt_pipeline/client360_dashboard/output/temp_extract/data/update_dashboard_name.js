/**
 * Update Dashboard Name Script
 * 
 * This script updates the dashboard name from "Client360 Dashboard" to "Danno"
 * and generates a patch file that can be applied to the deployed dashboard.
 */

const fs = require('fs');
const path = require('path');

// Files to update
const filesToSearch = [
  '../deploy/index.html', 
  '../deploy/staticwebapp.config.json',
  '../deploy/js/dashboard.js',
  '../deploy/README.md'
];

// The replacement mapping
const replacements = [
  { from: 'Client360 Dashboard', to: 'Danno' },
  { from: 'client360 dashboard', to: 'Danno' },
  { from: 'CLIENT360 DASHBOARD', to: 'DANNO' },
  { from: 'Client360', to: 'Danno' },
  { from: 'client360', to: 'danno' },
  { from: 'CLIENT360', to: 'DANNO' }
];

// Function to update files
const updateFiles = () => {
  const changes = [];
  const missingFiles = [];
  
  // Process each file
  filesToSearch.forEach(filePath => {
    const fullPath = path.resolve(__dirname, filePath);
    
    if (fs.existsSync(fullPath)) {
      // Read the file content
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      let hasChanges = false;
      
      // Apply replacements
      replacements.forEach(({ from, to }) => {
        const regex = new RegExp(from.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
        content = content.replace(regex, to);
      });
      
      // Check if there were changes
      if (content !== originalContent) {
        // Write the updated content back to the file
        fs.writeFileSync(fullPath, content, 'utf8');
        hasChanges = true;
        
        changes.push({
          file: filePath,
          replaced: true
        });
      } else {
        changes.push({
          file: filePath,
          replaced: false
        });
      }
    } else {
      missingFiles.push(filePath);
    }
  });
  
  return { changes, missingFiles };
};

// Function to create a patch file for deployment
const createPatchFile = () => {
  const patchContent = `
  /**
   * Danno Dashboard Name Update Patch
   * 
   * This script updates all references from Client360 to Danno
   * in the deployed dashboard.
   */
  
  (function() {
    console.log('Applying Danno dashboard name update patch...');
    
    // Update document title
    if (document.title.includes('Client360') || document.title.includes('client360')) {
      document.title = document.title
        .replace('Client360 Dashboard', 'Danno')
        .replace('client360 dashboard', 'Danno')
        .replace('CLIENT360 DASHBOARD', 'DANNO')
        .replace('Client360', 'Danno')
        .replace('client360', 'danno')
        .replace('CLIENT360', 'DANNO');
      
      console.log('Updated document title to:', document.title);
    }
    
    // Update header text
    document.querySelectorAll('h1, h2, h3, h4, h5, h6, .header-title, .dashboard-title, .navbar-brand')
      .forEach(element => {
        if (element.innerText.includes('Client360') || element.innerText.includes('client360')) {
          const originalText = element.innerText;
          element.innerText = element.innerText
            .replace('Client360 Dashboard', 'Danno')
            .replace('client360 dashboard', 'Danno')
            .replace('CLIENT360 DASHBOARD', 'DANNO')
            .replace('Client360', 'Danno')
            .replace('client360', 'danno')
            .replace('CLIENT360', 'DANNO');
          
          console.log('Updated heading from:', originalText, 'to:', element.innerText);
        }
      });
    
    // Update meta tags
    document.querySelectorAll('meta').forEach(meta => {
      if (meta.content && (meta.content.includes('Client360') || meta.content.includes('client360'))) {
        meta.content = meta.content
          .replace('Client360 Dashboard', 'Danno')
          .replace('client360 dashboard', 'Danno')
          .replace('CLIENT360 DASHBOARD', 'DANNO')
          .replace('Client360', 'Danno')
          .replace('client360', 'danno')
          .replace('CLIENT360', 'DANNO');
        
        console.log('Updated meta tag content');
      }
    });
    
    // Update any data attributes that might have the name
    document.querySelectorAll('[data-name], [data-title], [data-dashboard]').forEach(element => {
      ['data-name', 'data-title', 'data-dashboard'].forEach(attr => {
        if (element.hasAttribute(attr)) {
          const value = element.getAttribute(attr);
          if (value && (value.includes('Client360') || value.includes('client360'))) {
            const newValue = value
              .replace('Client360 Dashboard', 'Danno')
              .replace('client360 dashboard', 'Danno')
              .replace('CLIENT360 DASHBOARD', 'DANNO')
              .replace('Client360', 'Danno')
              .replace('client360', 'danno')
              .replace('CLIENT360', 'DANNO');
            
            element.setAttribute(attr, newValue);
            console.log(\`Updated \${attr} from: \${value} to: \${newValue}\`);
          }
        }
      });
    });
    
    console.log('Danno dashboard name update patch applied successfully!');
  })();
  `;
  
  const patchFilePath = path.resolve(__dirname, '../deploy/js/update-name-patch.js');
  fs.writeFileSync(patchFilePath, patchContent, 'utf8');
  
  console.log('Patch file created at:', patchFilePath);
  return patchFilePath;
};

// Function to create an injection script for HTML
const createInjectionScript = (patchFilePath) => {
  const relativeScriptPath = patchFilePath.split('/deploy/')[1];
  
  const injectionCode = `
  <!-- Add script to update dashboard name from Client360 to Danno -->
  <script src="/${relativeScriptPath}"></script>
  `;
  
  console.log('Add the following to the index.html file before the </body> tag:');
  console.log(injectionCode);
  
  // Also attempt to automatically inject into index.html
  const indexHtmlPath = path.resolve(__dirname, '../deploy/index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    if (!indexHtml.includes(relativeScriptPath)) {
      indexHtml = indexHtml.replace('</body>', `  ${injectionCode}\n</body>`);
      fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
      console.log('Successfully injected the script into index.html');
    } else {
      console.log('Script already injected into index.html');
    }
  } else {
    console.log('Warning: index.html not found at', indexHtmlPath);
  }
};

// Main execution
const { changes, missingFiles } = updateFiles();
console.log('\nUpdate Results:');
console.log('Files updated:');
changes.forEach(change => {
  console.log(`- ${change.file}: ${change.replaced ? 'UPDATED' : 'No changes needed'}`);
});

console.log('\nMissing files:');
if (missingFiles.length > 0) {
  missingFiles.forEach(file => {
    console.log(`- ${file}`);
  });
} else {
  console.log('None');
}

// Create patch files for deployment
console.log('\nCreating deployment patch...');
const patchFilePath = createPatchFile();
createInjectionScript(patchFilePath);

console.log('\nDONE: Dashboard name updated from "Client360 Dashboard" to "Danno"');
console.log('The changes will take effect after redeployment, or by manually applying the patch script.');