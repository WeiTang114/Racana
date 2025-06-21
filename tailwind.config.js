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
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        cyber: {
          blue: '#00d4ff',
          purple: '#8b5cf6',
          pink: '#ec4899',
          orange: '#f97316',
          green: '#10b981',
          yellow: '#fbbf24',
          red: '#ef4444',
          neon: '#00ff41',
          dark: '#0f0f23',
          darker: '#0a0a1a',
          light: '#1a1a2e',
          gray: '#16213e',
        }
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        'neon-gradient': 'linear-gradient(90deg, #00d4ff 0%, #8b5cf6 50%, #ec4899 100%)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 212, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(139, 92, 246, 0.5)',
        'neon-pink': '0 0 20px rgba(236, 72, 153, 0.5)',
        'neon-orange': '0 0 20px rgba(249, 115, 22, 0.5)',
      }
    },
  },
  plugins: [],
} 