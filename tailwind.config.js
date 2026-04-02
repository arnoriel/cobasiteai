/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#07080F',
          50: '#0D0F1A',
          100: '#111420',
          200: '#181C2E',
          300: '#1E2338',
          400: '#252B44',
        },
        surface: {
          DEFAULT: '#0F1120',
          border: '#1E2338',
          hover: '#181C2E',
        },
        accent: {
          DEFAULT: '#7C5CFC',
          dim: '#5A3DE8',
          glow: '#9B80FF',
          muted: 'rgba(124,92,252,0.15)',
        },
        teal: {
          accent: '#00E5D4',
          dim: '#00C4B5',
          muted: 'rgba(0,229,212,0.12)',
        },
        text: {
          primary: '#F0F2FF',
          secondary: '#8B90B4',
          muted: '#4A5070',
          code: '#C3BAF7',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 40px rgba(124,92,252,0.25)',
        'glow-teal': '0 0 30px rgba(0,229,212,0.2)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
