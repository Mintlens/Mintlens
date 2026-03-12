import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand mint — tiré du logo Mintlens (#4ecba6)
        mint: {
          50:  '#f0faf6',
          100: '#d9f3ea',
          200: '#b4e7d6',
          300: '#7fd4bb',
          400: '#4ecba6', // couleur logo principale
          500: '#35b590',
          600: '#279178',
          700: '#237462',
          800: '#1f5d50',
          900: '#1d4d43',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        'ios': '1rem',
        'ios-lg': '1.25rem',
      },
      boxShadow: {
        card: '0 0 0 1px rgb(0 0 0 / 0.03), 0 2px 8px 0 rgb(0 0 0 / 0.04)',
        'card-hover': '0 0 0 1px rgb(0 0 0 / 0.03), 0 8px 24px 0 rgb(0 0 0 / 0.08)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
      },
    },
  },
  plugins: [animate],
}

export default config
