/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        indigoCRT: '#1E2A5A',
        cyanNeon: '#00C2FF',
        magenta1up: '#FF2E63',
        retroGreen: '#22c55e',
        retroCyan: '#06b6d4',
        retroPurple: '#a855f7',
        retroPink: '#ec4899',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        'twinkle-delayed': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '0.9', transform: 'scale(1.3)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'float-medium': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-18px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        'pixel-border': {
          '0%, 100%': { borderColor: 'rgba(6, 182, 212, 0.5)' },
          '50%': { borderColor: 'rgba(6, 182, 212, 1)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-retro': {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        twinkle: 'twinkle 2s ease-in-out infinite',
        'twinkle-delayed': 'twinkle-delayed 2.5s ease-in-out infinite 0.5s',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'float-medium': 'float-medium 6s ease-in-out infinite 1s',
        'float-delayed': 'float-delayed 7s ease-in-out infinite 2s',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        scanline: 'scanline 8s linear infinite',
        glitch: 'glitch 0.3s ease-in-out infinite',
        'pixel-border': 'pixel-border 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'bounce-retro': 'bounce-retro 2s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
