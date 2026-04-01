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
          DEFAULT: '#E67E22',
          dark: '#D35400',
          light: '#F39C12',
        },
        secondary: '#2C3E50',
        accent: '#27AE60',
        danger: '#E74C3C',
        warning: '#F39C12',
        cream: '#FDF6E3',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
