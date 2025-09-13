#!/bin/bash
# Build themes for Client360 Dashboard

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building theme bundles for Client360 Dashboard${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm ci
fi

# Build the theme bundles
echo -e "${YELLOW}Building themes...${NC}"
npm run build:themes

# Check if build was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Themes built successfully${NC}"
  
  # List the generated files
  echo -e "${YELLOW}Generated files:${NC}"
  ls -la dist/
  
  # Copy the theme files to the deployment directory
  echo -e "${YELLOW}Copying theme files to deployment directory...${NC}"
  mkdir -p deploy/css
  mkdir -p deploy/assets
  
  # Copy CSS files
  cp dist/*.css deploy/css/
  
  # Copy assets
  cp -r dist/assets/* deploy/assets/
  
  echo -e "${GREEN}✓ Themes deployed to the deployment directory${NC}"
  echo -e "${YELLOW}Generated themes:${NC}"
  ls -la deploy/css/
else
  echo -e "${RED}✗ Theme build failed${NC}"
  exit 1
fi

# Create theme selector script
echo -e "${YELLOW}Creating theme selector script...${NC}"

cat > deploy/js/theme-selector.js << EOF
/**
 * Client360 Dashboard Theme Selector
 * Dynamically loads the appropriate theme CSS based on tenant/brand
 */
(function() {
  // Default theme
  var defaultTheme = 'tbwa';
  
  // Get tenant from URL parameter, localStorage, or use default
  function getCurrentTenant() {
    // Check URL parameter first
    var urlParams = new URLSearchParams(window.location.search);
    var tenant = urlParams.get('tenant');
    
    // If not in URL, check localStorage
    if (!tenant) {
      tenant = localStorage.getItem('client360_tenant');
    }
    
    // If still not found, use default
    if (!tenant) {
      tenant = defaultTheme;
    }
    
    return tenant;
  }
  
  // Load the appropriate CSS
  function loadThemeCSS(tenant) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/' + tenant + '.css';
    document.head.appendChild(link);
    
    // Store the selected tenant in localStorage
    localStorage.setItem('client360_tenant', tenant);
    
    console.log('Loaded theme: ' + tenant);
    
    // Add tenant as a class to the body for additional styling
    document.body.classList.add('tenant-' + tenant);
    
    // Dispatch an event that the theme has loaded
    document.dispatchEvent(new CustomEvent('themeLoaded', { detail: { tenant: tenant } }));
  }
  
  // Switch themes
  window.switchTheme = function(tenant) {
    // Remove existing theme links
    var existingLinks = document.querySelectorAll('link[href^="/css/"][href$=".css"]');
    existingLinks.forEach(function(link) {
      link.remove();
    });
    
    // Remove tenant classes from body
    document.body.className = document.body.className
      .split(' ')
      .filter(function(cls) { return !cls.startsWith('tenant-'); })
      .join(' ');
    
    // Load the new theme
    loadThemeCSS(tenant);
    
    // Update URL without reloading the page
    var url = new URL(window.location);
    url.searchParams.set('tenant', tenant);
    window.history.pushState({}, '', url);
  }
  
  // Initialize theme on page load
  document.addEventListener('DOMContentLoaded', function() {
    var tenant = getCurrentTenant();
    loadThemeCSS(tenant);
  });
})();
EOF

echo -e "${GREEN}✓ Theme selector script created${NC}"
echo -e "${GREEN}Build process completed successfully${NC}"