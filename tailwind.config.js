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
        // Light theme colors (improved contrast for WCAG AA)
        'light-bg-primary': '#FFFFFF',
        'light-bg-secondary': '#F9FAFB',
        'light-bg-tertiary': '#F3F4F6',
        'light-border': '#D1D5DB', // Darker border for better visibility
        'light-text-primary': '#111827',
        'light-text-secondary': '#4B5563', // Darker gray for better contrast
        'light-text-tertiary': '#6B7280', // Darker gray for better contrast
        // Legacy dark colors (for reference)
        'flash-dark-1': '#0F172A',
        'flash-dark-2': '#1E293B',
        'flash-dark-3': '#334155',
        // Bitcoin orange
        'btc-orange': '#f2a900',
        // Component system colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
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