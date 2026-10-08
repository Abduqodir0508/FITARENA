/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyberDark: '#090d16',
        cyberCard: '#111827',
        cyberBorder: '#1f293d',
        neonGreen: '#10b981',
        neonCyan: '#06b6d4',
        neonAmber: '#f59e0b',
        neonRed: '#ef4444'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' },
          '100%': { boxShadow: '0 0 25px rgba(16, 185, 129, 0.9)' }
        }
      }
    },
  },
  plugins: [],
}
