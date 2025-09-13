/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px instead of default 12px
      },
      colors: {
        // TBWA Brand Colors
        'tbwa-yellow': '#FFCF00',
        'tbwa-yellow-light': 'rgba(255, 207, 0, 0.15)',
        'tbwa-yellow-hover': 'rgba(255, 207, 0, 0.9)',
        'tbwa-black': '#000000',
        'tbwa-black-light': 'rgba(0, 0, 0, 0.1)',
        'tbwa-slate': '#4B5563',
        'tbwa-red': '#EF4444',
        'tbwa-blue': '#3B82F6',
        'tbwa-gray': '#9CA3AF',
        
        // Power BI Style Colors - mapped to TBWA palette
        'azure-blue': '#3B82F6',
        'azure-background': '#f7f9fc',
        'azure-red': '#EF4444',
        'azure-orange': '#FFCF00',
        'azure-green': '#107C10',
        'azure-gray': '#9CA3AF',
        'azure-grayLight': '#D2D2D2',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'card': '0.5rem',
      },
      fontFamily: {
        'sans': ['Inter var', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out forwards',
        'pulse': 'pulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(255, 207, 0, 0.4)' },
          '70%': { boxShadow: '0 0 0 6px rgba(255, 207, 0, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255, 207, 0, 0)' },
        },
      },
    },
  },
  plugins: [],
}