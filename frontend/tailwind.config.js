///** @type {import('tailwindcss').Config} */
//
//export default {
//  content: [
//    "./index.html",
//    "./src/**/*.{js,ts,jsx,tsx}",
//  ],
//  theme: {
//    extend: {
//      animation: {
//        // Новое название, чтобы отразить суть - "редкий пинг"
//        'ping-rare': 'ping-rare 4s cubic-bezier(0, 0, 0.2, 1) infinite',
//        // Новое название - "редкий пульс"
//        'pulse-rare': 'pulse-rare 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
//      },
//      keyframes: {
//        'ping-rare': {
//          // Явно указываем начальное состояние
//          '0%': {
//            transform: 'scale(1)',
//            opacity: '1',
//          },
//          // Анимация "взрыва" происходит за 1.5 секунды (37.5% от 4с)
//          '37.5%': {
//            transform: 'scale(1.8)', // Сделаем чуть меньше, чтобы было изящнее
//            opacity: '0',
//          },
//          // Остальное время (62.5% или 2.5 секунды) - анимация "отдыхает"
//          '100%': {
//            transform: 'scale(1.8)',
//            opacity: '0',
//          },
//        },
//        'pulse-rare': {
//          // Явно указываем начальное и конечное состояние для цикла
//          '0%, 100%': { opacity: 1 },
//          // Сама пульсация (угасание) происходит в первой четверти времени (за 1 секунду)
//          '25%': { opacity: 0.6 },
//          // Остальные 75% времени (3 секунды) - элемент остается непрозрачным, создавая паузу
//          // На 50% мы возвращаем opacity: 1, чтобы пульс завершился
//          '50%': { opacity: 1 },
//        },
//      },
//
//      colors: {
//        'primary-bg': '#2c3e50',
//        'gold-accent': '#D4AF37',   // Переименовали 'gold' для ясности
//        'deep-teal': '#38a3ab',
//        'ips-red': '#ee2346',       // Для редких, но ярких акцентов
//        'text-light': '#ecf0f1',
//        'text-dark': '#2c3e50',
//        'glass-border': 'rgba(255, 255, 255, 0.1)',
//      },
//      fontFamily: {
//        'syne': ['Syne', 'sans-serif'], // У вас уже было
//        'garamond': ['Cormorant Garamond', 'serif'], // У вас уже было
//      },
//      // Добавляем кастомные тени и другие эффекты, если понадобится
//    },
//  },
//  plugins: [],
//}


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
