/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#F5B82E',
          50: '#fffdf5',
          100: '#fef7dc',
          200: '#fde8a1',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#F5B82E',
          600: '#C98A14',
          700: '#9b640a',
          800: '#784a0c',
          900: '#452707',
          dark: '#C98A14',
          light: '#FCE8A6'
        },
        dark: {
          bg: '#05090D',
          surface: '#0B1117',
          card: 'rgba(15, 20, 25, 0.75)',
          border: 'rgba(245, 184, 46, 0.16)'
        },
        ink: {
          950: '#05090D',
          900: '#0B1117',
          850: '#111720',
          800: '#171E28',
          700: 'rgba(255, 255, 255, 0.08)',
          600: 'rgba(255, 255, 255, 0.12)'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        'gold-sm': '0 0 15px rgba(245, 184, 46, 0.18)',
        'gold-md': '0 0 25px rgba(245, 184, 46, 0.28)',
        'gold-lg': '0 0 40px rgba(245, 184, 46, 0.38)',
        'glass': '0 10px 40px rgba(0, 0, 0, 0.40)'
      }
    }
  }
};
