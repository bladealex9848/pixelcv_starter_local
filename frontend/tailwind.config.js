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
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
