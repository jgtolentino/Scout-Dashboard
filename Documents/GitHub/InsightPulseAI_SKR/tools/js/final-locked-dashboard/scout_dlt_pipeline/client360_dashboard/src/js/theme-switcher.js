/**
 * Theme Switcher - Handles client theme selection and persistence
 */

(function() {
  // Available themes
  const AVAILABLE_THEMES = ['tbwa', 'sarisari', 'client-custom'];
  const DEFAULT_THEME = 'tbwa';
  
  // DOM selectors
  const HTML_ROOT = document.documentElement;
  const STORAGE_KEY = 'client360_theme';
  
  /**
   * Initialize the theme system
   */
  function initTheme() {
    // Set default theme attribute if none exists
    if (!HTML_ROOT.hasAttribute('data-theme')) {
      HTML_ROOT.setAttribute('data-theme', DEFAULT_THEME);
    }
    
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme && AVAILABLE_THEMES.includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      // Check for URL parameter override
      const urlParams = new URLSearchParams(window.location.search);
      const themeParam = urlParams.get('theme');
      
      if (themeParam && AVAILABLE_THEMES.includes(themeParam)) {
        setTheme(themeParam);
      }
    }
    
    // Initialize theme toggle UI if it exists
    setupThemeToggle();
  }
  
  /**
   * Set the active theme
   * @param {string} theme - The theme identifier
   */
  function setTheme(theme) {
    if (!AVAILABLE_THEMES.includes(theme)) {
      console.warn(`Theme "${theme}" is not available. Using default.`);
      theme = DEFAULT_THEME;
    }
    
    // Set the data-theme attribute
    HTML_ROOT.setAttribute('data-theme', theme);
    
    // Save to localStorage for persistence
    localStorage.setItem(STORAGE_KEY, theme);
    
    // Update any UI elements that show the current theme
    updateThemeUI(theme);
    
    // Dispatch custom event for theme change
    const event = new CustomEvent('themeChanged', { detail: { theme } });
    document.dispatchEvent(event);
    
    console.log(`Theme set to: ${theme}`);
  }
  
  /**
   * Update UI elements showing current theme
   * @param {string} currentTheme - The active theme
   */
  function updateThemeUI(currentTheme) {
    // Update theme selector if it exists
    const themeSelectors = document.querySelectorAll('[data-theme-selector]');
    themeSelectors.forEach(selector => {
      if (selector.tagName === 'SELECT') {
        selector.value = currentTheme;
      } else if (selector.tagName === 'INPUT' && selector.type === 'radio') {
        selector.checked = selector.value === currentTheme;
      }
    });
    
    // Update theme toggle buttons if they exist
    const themeToggles = document.querySelectorAll('[data-theme-toggle]');
    themeToggles.forEach(toggle => {
      const targetTheme = toggle.getAttribute('data-theme-toggle');
      toggle.classList.toggle('active', targetTheme === currentTheme);
    });
  }
  
  /**
   * Set up theme toggle UI elements
   */
  function setupThemeToggle() {
    // Set up select dropdowns
    const themeSelectors = document.querySelectorAll('[data-theme-selector]');
    themeSelectors.forEach(selector => {
      // Remove existing event listener to prevent duplicates
      selector.removeEventListener('change', handleSelectorChange);
      // Add event listener
      selector.addEventListener('change', handleSelectorChange);
    });
    
    // Set up toggle buttons
    const themeToggles = document.querySelectorAll('[data-theme-toggle]');
    themeToggles.forEach(toggle => {
      // Remove existing event listener to prevent duplicates
      toggle.removeEventListener('click', handleToggleClick);
      // Add event listener
      toggle.addEventListener('click', handleToggleClick);
    });
  }
  
  /**
   * Handle theme selector change event
   * @param {Event} event - The change event
   */
  function handleSelectorChange(event) {
    const newTheme = event.target.value;
    setTheme(newTheme);
  }
  
  /**
   * Handle theme toggle button click
   * @param {Event} event - The click event
   */
  function handleToggleClick(event) {
    const toggleButton = event.currentTarget;
    const newTheme = toggleButton.getAttribute('data-theme-toggle');
    
    if (newTheme) {
      setTheme(newTheme);
    }
  }
  
  /**
   * Get the current theme
   * @returns {string} The current theme name
   */
  function getCurrentTheme() {
    return HTML_ROOT.getAttribute('data-theme') || DEFAULT_THEME;
  }
  
  // Public API
  window.ThemeSwitcher = {
    init: initTheme,
    setTheme: setTheme,
    getCurrentTheme: getCurrentTheme,
    getAvailableThemes: () => [...AVAILABLE_THEMES]
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();