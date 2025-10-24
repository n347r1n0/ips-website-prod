// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = { // 👈 ГЛАВНОЕ ИЗМЕНЕНИЕ ЗДЕСЬ
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'ping-rare': 'ping-rare 4s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-rare': 'pulse-rare 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'ping-rare': {
          '0%': {
            transform: 'scale(1)',
            opacity: '1',
          },
          '37.5%': {
            transform: 'scale(1.8)',
            opacity: '0',
          },
          '100%': {
            transform: 'scale(1.8)',
            opacity: '0',
          },
        },
        'pulse-rare': {
          '0%, 100%': { opacity: 1 },
          '25%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
      },
      colors: {
        'primary-bg': '#2c3e50',
        'gold-accent': '#D4AF37',
        'deep-teal': '#38a3ab',
        'ips-red': '#ee2346',
        'text-light': '#ecf0f1',
        'text-dark': '#2c3e50',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        'syne': ['Syne', 'sans-serif'],
        'garamond': ['Cormorant Garamond', 'serif'],
        'brand': ['Museo Cyrl', 'sans-serif'], // Назовем его 'brand' для удобства
      },
    },
  },
  plugins: [],
};
