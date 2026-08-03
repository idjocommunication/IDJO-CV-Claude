import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-anton)', 'Impact', 'sans-serif'],
      },
      colors: {
        /* Palette reprise de la référence : bleu nuit profond, bleu roi
           lumineux et blancs bleutés. */
        ink: {
          DEFAULT: '#081B36',
          soft: '#0E2447',
          muted: '#5A6E8C',
        },
        navy: {
          900: '#04122B',
          800: '#081B36',
          700: '#0E2A52',
          600: '#153A6E',
          500: '#1D4C8C',
        },
        azur: {
          700: '#1450B4',
          600: '#1B62D6',
          500: '#2C7CEC',
          400: '#5C9CF3',
          300: '#93BEF8',
          200: '#C3DBFB',
          100: '#E1EDFD',
          50: '#F2F7FE',
        },
        cloud: {
          DEFAULT: '#F6F9FE',
          200: '#EDF3FC',
          300: '#DDE7F5',
          400: '#C6D5EA',
        },
      },
      maxWidth: {
        content: '1240px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(8,27,54,.05), 0 12px 32px -12px rgba(8,27,54,.18)',
        float: '0 24px 60px -24px rgba(8,27,54,.4)',
        page: '0 10px 40px -10px rgba(8,27,54,.28)',
        glow: '0 0 0 1px rgba(255,255,255,.08), 0 30px 70px -30px rgba(44,124,236,.65)',
      },
      backgroundImage: {
        'navy-glow':
          'radial-gradient(1100px 520px at 50% -10%, rgba(44,124,236,.45), transparent 70%), linear-gradient(180deg, #081B36 0%, #04122B 100%)',
        'azur-btn': 'linear-gradient(180deg, #2C7CEC 0%, #1B62D6 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .7s cubic-bezier(.16,1,.3,1) both',
        'fade-in': 'fade-in .6s ease both',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
