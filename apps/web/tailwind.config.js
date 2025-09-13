/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        azure: {
          blue: '#0078D4',
          blueLight: '#50E6FF',
          blueDark: '#004578',
          green: '#107C10',
          greenLight: '#5CB85C',
          orange: '#FF8C00',
          orangeLight: '#FFB900',
          red: '#E81123',
          redLight: '#FF4343',
          background: '#F8F9FA',
          gray: '#737373',
          grayLight: '#D2D2D2',
        },
        tbwa: {
          yellow: '#FFCC00',
          darkBlue: '#002B5B',
          background: '#FFFFFF',
          gray: '#F2F2F2',
          error: '#E63946',
          success: '#4CAF50',
        }
      },
    },
  },
  plugins: [],
}