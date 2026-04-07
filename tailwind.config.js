/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      boxShadow: {
        'at-card': '0 8px 24px rgba(0, 61, 165, 0.08)',
        'at-card-lg': '0 20px 40px rgba(0, 61, 165, 0.12)',
        'at-elevated': '0 4px 14px rgba(26, 29, 38, 0.08)',
      },
      colors: {
        'at-green':       '#00A650',
        'at-green-dark':  '#007A3A',
        'at-green-light': '#E6F7EE',
        'at-blue':        '#003DA5',
        'at-blue-dark':   '#002580',
        'at-blue-light':  '#E6EDF8',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
