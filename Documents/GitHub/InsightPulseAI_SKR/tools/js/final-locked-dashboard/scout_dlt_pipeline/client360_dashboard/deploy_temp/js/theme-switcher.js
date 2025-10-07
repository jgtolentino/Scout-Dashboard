// Theme switcher functionality
document.addEventListener('DOMContentLoaded', function() {
  const themeSelector = document.querySelector('[data-theme-selector]');
  
  if (themeSelector) {
    themeSelector.addEventListener('change', function() {
      const selectedTheme = this.value;
      document.documentElement.setAttribute('data-theme', selectedTheme);
      localStorage.setItem('preferredTheme', selectedTheme);
    });
    
    // Set theme from localStorage if available
    const savedTheme = localStorage.getItem('preferredTheme');
    if (savedTheme) {
      themeSelector.value = savedTheme;
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }
});