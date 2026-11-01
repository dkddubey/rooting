/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f8f5',
          100: '#e1efe8',
          200: '#c5dfd4',
          300: '#9bc6b7',
          400: '#6ea896',
          500: '#4e8c7a',
          600: '#3c7162',
          700: '#325b50',
          800: '#2b4941',
          900: '#253d37',
          950: '#13221e'
        },
        parchment: {
          50: '#faf8f5',
          100: '#f4ede2',
          200: '#e8dac3',
          300: '#d8c29e',
          400: '#c6a578',
          500: '#b78d59',
          600: '#a37648',
          700: '#835b3c',
          800: '#6b4b35',
          900: '#583f2e'
        }
      }
    },
  },
  plugins: [],
}

