
export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        ink: {
          950: 'rgba(15, 15, 15, 0.65)',
          900: 'rgba(20, 20, 20, 0.45)',
          850: 'rgba(23, 23, 23, 0.35)',
          800: 'rgba(26, 26, 26, 0.25)',
          700: 'rgba(255, 255, 255, 0.08)',
          600: 'rgba(255, 255, 255, 0.12)',
        },
        gold: {
          DEFAULT: '#d4af37',
          400: '#e0c257',
          600: '#b8952b',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
}

