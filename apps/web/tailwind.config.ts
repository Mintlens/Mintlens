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
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        'ios': '1rem',
        'ios-lg': '1.25rem',
        'canvas': '1.5rem',
      },
      boxShadow: {
        card: '0 0 0 1px rgb(0 0 0 / 0.03), 0 2px 8px 0 rgb(0 0 0 / 0.04)',
        'card-hover': '0 0 0 1px rgb(0 0 0 / 0.03), 0 8px 24px 0 rgb(0 0 0 / 0.08)',
        'canvas': '0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.03), 0 12px 48px rgba(0,0,0,0.04)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'stagger-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'stagger-in': 'stagger-in 0.4s ease-out both',
      },
    },
  },
  plugins: [animate],
}

export default config
