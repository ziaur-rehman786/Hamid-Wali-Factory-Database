/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* Navy blue — from logo ring */
        primary: {
          50: '#e8eef5',
          100: '#c5d4e8',
          200: '#9eb5d4',
          300: '#7796c0',
          400: '#4f6f9e',
          500: '#2d4f7c',
          600: '#1a3a5c',
          700: '#0f2d4a',
          800: '#0a2340',
          900: '#001f3f',
          950: '#001529',
        },
        /* Gold — from logo text & accents */
        gold: {
          50: '#faf6e8',
          100: '#f3e9c4',
          200: '#e8d08a',
          300: '#d4af37',
          400: '#c9a227',
          500: '#b8860b',
          600: '#9a7209',
          700: '#7a5a07',
          800: '#5c4405',
          900: '#3d2e03',
        },
        factory: {
          navy: '#001f3f',
          gold: '#d4af37',
          cream: '#f8f6f1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 4px 14px rgba(212, 175, 55, 0.25)',
        navy: '0 4px 14px rgba(0, 31, 63, 0.2)',
      },
    },
  },
  plugins: [],
};
