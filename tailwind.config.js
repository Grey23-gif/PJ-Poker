/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--canvas) / <alpha-value>)',
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        navigation: 'rgb(var(--navigation) / <alpha-value>)',
        field: 'rgb(var(--field) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        content: 'rgb(var(--content) / <alpha-value>)',
        secondary: 'rgb(var(--secondary) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: { DEFAULT: 'rgb(var(--line) / <alpha-value>)', strong: 'rgb(var(--line-strong) / <alpha-value>)' },
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        gold: 'var(--color-gold)',
        surface: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          light: 'rgb(var(--raised) / <alpha-value>)',
          card: 'rgb(var(--card) / <alpha-value>)',
          hover: 'rgb(var(--raised) / <alpha-value>)',
          border: 'rgb(var(--line) / <alpha-value>)'
        },
        poker: {
          green: {
            DEFAULT: '#34d399',
            dark: '#064e3b',
            deep: '#065f46',
            light: '#6ee7b7',
            table: '#0f4c3a',
          },
          gold: {
            DEFAULT: '#d8b56c',
            light: '#fbbf24',
            dark: '#b45309',
            glow: '#fcd34d',
          },
          red: {
            DEFAULT: '#ef4444',
            dark: '#991b1b',
            light: '#f87171'
          },
          chip: {
            white: '#f8fafc',
            red: '#ef4444',
            blue: '#3b82f6',
            green: '#10b981',
            black: '#1e293b',
            purple: '#8b5cf6',
            gold: '#f59e0b'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace']
      },
      boxShadow: {
        'glow-green': 'none',
        'glow-gold': 'none',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'inner-table': 'inset 0 2px 12px 0 rgba(0, 0, 0, 0.6)'
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
