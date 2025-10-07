/**
 * Theme Selector for Client360 Dashboard
 * 
 * This script manages theme switching between TBWA and Sari-Sari themes.
 * It dynamically loads the appropriate CSS file and stores the user's preference.
 */

// Default theme (can be overridden by user preference or query param)
const DEFAULT_THEME = 'sarisari';

// Available themes
const THEMES = {
  sarisari: {
    name: 'Sari Sari',
    stylesheet: '/css/themes/sarisari.css',
    logo: '/assets/logos/sarisari-logo.svg'
  },
  tbwa: {
    name: 'TBWA',
    stylesheet: '/css/themes/tbwa.css',
    logo: '/assets/logos/tbwa-logo.svg'
  }
};

// DOM content loaded event listener
document.addEventListener('DOMContentLoaded', function() {
  initializeThemeSelector();
});

/**
 * Initialize the theme selector
 * - Check for query param override
 * - Check for stored preference
 * - Apply the appropriate theme
 * - Set up the theme selector dropdown
 */
function initializeThemeSelector() {
  // Check for theme override in URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const themeParam = urlParams.get('theme');
  
  // Get stored theme preference or use default
  let currentTheme = localStorage.getItem('client360_theme') || DEFAULT_THEME;
  
  // Override from query param if provided
  if (themeParam && THEMES[themeParam]) {
    currentTheme = themeParam;
  }
  
  // Apply the theme
  applyTheme(currentTheme);
  
  // Set up the theme selector dropdown
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    // Set the current value
    themeSelect.value = currentTheme;
    
    // Add event listener for changes
    themeSelect.addEventListener('change', function(e) {
      switchTheme(e.target.value);
    });
  }
}

/**
 * Apply the specified theme to the dashboard
 * @param {string} themeName - The name of the theme to apply (must be a key in THEMES)
 */
function applyTheme(themeName) {
  // Validate theme name
  if (!THEMES[themeName]) {
    console.error(`Theme "${themeName}" is not defined. Using default theme instead.`);
    themeName = DEFAULT_THEME;
  }
  
  const theme = THEMES[themeName];
  
  // Create or update the theme stylesheet link
  let styleLink = document.getElementById('theme-stylesheet');
  if (!styleLink) {
    styleLink = document.createElement('link');
    styleLink.id = 'theme-stylesheet';
    styleLink.rel = 'stylesheet';
    styleLink.type = 'text/css';
    document.head.appendChild(styleLink);
  }
  
  // Update the href attribute
  styleLink.href = theme.stylesheet;
  
  // Store the preference
  localStorage.setItem('client360_theme', themeName);
  
  // Update logo if it exists
  const logoElement = document.querySelector('.header-logo');
  if (logoElement) {
    logoElement.style.backgroundImage = `url(${theme.logo})`;
  }
  
  // Update dashboard title if it exists
  const titleElement = document.querySelector('.header-title');
  if (titleElement) {
    titleElement.textContent = themeName === 'sarisari' ? 
      'Sari Sari FMCG Dashboard' : 
      'TBWA Client 360 Dashboard';
  }
  
  // Dispatch an event that the theme has been loaded
  document.dispatchEvent(new CustomEvent('themeLoaded', { 
    detail: { 
      themeName: themeName, 
      theme: theme 
    } 
  }));
  
  // Add theme class to body for conditional styling
  document.body.className = `theme-${themeName}`;
  
  console.log(`Applied theme: ${theme.name}`);
}

/**
 * Switch the dashboard theme
 * @param {string} themeName - The name of the theme to switch to
 */
function switchTheme(themeName) {
  applyTheme(themeName);
  
  // If the URL already has a theme parameter, update it
  // Otherwise, add it
  const url = new URL(window.location.href);
  url.searchParams.set('theme', themeName);
  window.history.replaceState({}, '', url);
}

// Make switchTheme available globally
window.switchTheme = switchTheme;