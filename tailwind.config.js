/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Flash branding colors from flash-intake
        'flash-green': '#00A86B',
        'flash-green-light': '#00C17D',
        'flash-green-dark': '#008F5A',
        'flash-yellow': '#FFD700',
        'flash-yellow-light': '#FFDF33',
        'flash-yellow-dark': '#E6C200',
        'flash-dark-1': '#0F172A',
        'flash-dark-2': '#1E293B',
        'flash-dark-3': '#334155',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      gridTemplateColumns: {
        'dashboard': 'minmax(64px, 240px) 1fr',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};