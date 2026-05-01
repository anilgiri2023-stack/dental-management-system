/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0891b2', // Cyan 600
          dark: '#0e7490',    // Cyan 700
          light: '#67e8f9',   // Cyan 300
          50: '#ecfeff',
        },
        secondary: {
          DEFAULT: '#fbbf24', // Amber 400
          dark: '#d97706',    // Amber 600
          light: '#fcd34d',   // Amber 300
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
