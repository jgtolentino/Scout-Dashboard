// theme-selector.js
// Handles dynamic theme selection and switching

// Default theme (can be overridden by URL parameter or localStorage)
const DEFAULT_THEME = 'tbwa';

// Get theme from URL parameter, localStorage, or use default
function getCurrentTheme() {
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const themeParam = urlParams.get('tenant');
  
  if (themeParam && isValidTheme(themeParam)) {
    // Save to localStorage and return
    localStorage.setItem('dashboard_theme', themeParam);
    return themeParam;
  }
  
  // Check localStorage next
  const storedTheme = localStorage.getItem('dashboard_theme');
  if (storedTheme && isValidTheme(storedTheme)) {
    return storedTheme;
  }
  
  // Fall back to default
  return DEFAULT_THEME;
}

// Validate theme name
function isValidTheme(theme) {
  const validThemes = ['tbwa', 'sarisari'];
  return validThemes.includes(theme.toLowerCase());
}

// Load the appropriate theme CSS
function loadThemeCSS(theme) {
  // Remove any existing theme stylesheets
  const existingTheme = document.querySelector('link[data-theme-css]');
  if (existingTheme) {
    existingTheme.remove();
  }
  
  // Create and append the new theme stylesheet
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `/${theme}.css`;
  link.setAttribute('data-theme-css', theme);
  document.head.appendChild(link);
  
  // Update select dropdown if it exists
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = theme;
  }
  
  // Set theme as data attribute on body
  document.body.setAttribute('data-theme', theme);
  
  // Dispatch event when theme is loaded
  link.onload = function() {
    document.dispatchEvent(new Event('themeLoaded'));
  };
}

// Function to switch themes
function switchTheme(theme) {
  if (!isValidTheme(theme)) {
    console.error(`Invalid theme: ${theme}`);
    return;
  }
  
  // Save to localStorage
  localStorage.setItem('dashboard_theme', theme);
  
  // Load the CSS
  loadThemeCSS(theme);
  
  // Update URL without reloading the page
  const url = new URL(window.location);
  url.searchParams.set('tenant', theme);
  window.history.pushState({}, '', url);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
  const theme = getCurrentTheme();
  loadThemeCSS(theme);
  
  // Expose the switchTheme function globally
  window.switchTheme = switchTheme;
});