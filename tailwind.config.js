/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: '#FFC5D3',
          purple: '#E8DFFF',
          green: '#E5F9F3',
          rose: '#FFF0F3',
          beige: '#F5F5DC',
        },
        coquette: {
          pink: '#FFB6C1',
          rose: '#FF8DA1',
          gold: '#FFD700',
          dark: '#333333',
        }
      },
      fontFamily: {
        mono: ['"Martian Mono"', 'monospace'],
        sans: ['"Manrope"', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
        cursive: ['"Great Vibes"', 'cursive'],
        display: ['"Cormorant Garamond"', 'serif'],
      },
      boxShadow: {
        'brutalist-sm': '2px 2px 0px 0px #000000',
        'brutalist': '4px 4px 0px 0px #000000',
        'brutalist-lg': '8px 8px 0px 0px #000000',
        'brutalist-pink': '6px 6px 0px 0px #FFB6C1',
        'brutalist-green': '6px 6px 0px 0px #E5F9F3',
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'float-medium': 'float-medium 4.5s ease-in-out infinite',
        'float-fast': 'float-fast 3s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 8s ease-in-out infinite',
        'spin-slow': 'spin-slow 25s linear infinite',
        'drift-1': 'drift-1 25s ease-in-out infinite',
        'drift-2': 'drift-2 30s ease-in-out infinite',
        'drift-3': 'drift-3 28s ease-in-out infinite',
        'marquee': 'marquee 20s linear infinite',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(0.5deg)' },
        },
        'float-medium': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-7px) rotate(-0.5deg)' },
        },
        'float-fast': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.03)' },
        },
        'drift-1': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -45px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        'drift-2': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(-40px, 30px) scale(0.9)' },
          '66%': { transform: 'translate(20px, -30px) scale(1.05)' },
        },
        'drift-3': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(15px, 35px) scale(1.02)' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}

