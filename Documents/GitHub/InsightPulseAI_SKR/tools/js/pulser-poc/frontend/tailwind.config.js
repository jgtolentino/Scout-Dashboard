/** @type {import('tailwindcss').Config} */
const theme = require('../theme.json');

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map theme colors to Tailwind
        primary: theme.colors.primary,
        success: theme.colors.success,
        warning: theme.colors.warning,
        danger: theme.colors.danger,
        gray: theme.colors.gray,
        
        // Additional semantic colors
        cardBg: theme.colors.cardBg,
        background: theme.colors.background,
        surface: theme.colors.surface,
        border: theme.colors.border,
        text: theme.colors.text,
      },
      spacing: theme.spacing,
      borderRadius: theme.radii,
      boxShadow: {
        ...theme.shadows,
        'card': theme.shadows.card,
        'card-hover': theme.shadows.cardHover,
      },
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize,
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [
    // Generate CSS variables from theme
    function({ addBase, config }) {
      const colors = config('theme.colors');
      const cssVars = {};
      
      // Flatten color object and create CSS variables
      const flattenColors = (obj, prefix = '') => {
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const varName = prefix ? `${prefix}-${key}` : key;
          
          if (typeof value === 'string') {
            cssVars[`--color-${varName}`] = value;
          } else if (typeof value === 'object') {
            flattenColors(value, varName);
          }
        });
      };
      
      flattenColors(colors);
      
      // Add spacing variables
      Object.entries(config('theme.spacing')).forEach(([key, value]) => {
        cssVars[`--spacing-${key}`] = value;
      });
      
      // Add shadow variables
      Object.entries(config('theme.boxShadow')).forEach(([key, value]) => {
        cssVars[`--shadow-${key}`] = value;
      });
      
      addBase({
        ':root': cssVars,
      });
    },
  ],
}