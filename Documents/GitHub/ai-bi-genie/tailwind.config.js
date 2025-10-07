/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ces-primary': {
          50: '#eff6ff',
          100: '#dbeafe', 
          500: '#0052cc',
          600: '#0073e6',
          900: '#1e3a8a'
        },
        'ces-gray': {
          50: '#f8f9fa',
          100: '#e9ecef',
          500: '#6c757d',
          900: '#212529'
        }
      },
      fontFamily: {
        'ces': ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'ces-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ces-fade-in': 'fadeIn 0.5s ease-in-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}