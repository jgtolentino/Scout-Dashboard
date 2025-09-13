/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./public/**/*.html",
    "./index.html"
  ],
  safelist: [
    // Safe classes that should always be included
    'dark',
    'data-theme-tbwa',
    'data-theme-sarisari',
    'data-theme-client-custom',
    'rollback-dashboard',
    'rollback-dashboard-header',
    'rollback-dashboard-content',
    'rollback-dashboard-actions',
    'rollback-dashboard-log'
  ],
  theme: {
    // Disable default colors to force token usage
    colors: {},
    spacing: {},
    // Extend with our tokens
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        'primary-light': 'var(--color-primary-light)',
        secondary: 'var(--color-secondary)',
        'secondary-dark': 'var(--color-secondary-dark)',
        'secondary-light': 'var(--color-secondary-light)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
        light: 'var(--color-light)',
        dark: 'var(--color-dark)',
        
        // Text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-light': 'var(--text-light)',
        
        // Background colors
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-card': 'var(--bg-card)',
        'bg-card-hover': 'var(--bg-card-hover)',
        
        // Border colors
        border: 'var(--border-color)',
        
        // Special colors for rollback component
        'rollback-bg': 'var(--rollback-bg)',
        'rollback-border': 'var(--rollback-border)',
        'rollback-title': 'var(--rollback-title)',
        'rollback-text': 'var(--rollback-text)',
        'rollback-action-primary': 'var(--rollback-action-primary)',
        'rollback-action-secondary': 'var(--rollback-action-secondary)',
        'rollback-info-bg': 'var(--rollback-info-bg)'
      },
      borderRadius: {
        none: '0',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-round)'
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)'
      },
      fontFamily: {
        sans: 'var(--font-family-base)',
        heading: 'var(--font-family-heading)'
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)'
      },
      transitionProperty: {
        DEFAULT: 'var(--transition-base)'
      }
    }
  },
  plugins: [],
  // Turn off arbitrary values to enforce token usage
  corePlugins: {
    preflight: true
  },
  variants: {
    extend: {}
  }
};