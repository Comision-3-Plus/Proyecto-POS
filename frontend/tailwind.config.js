/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Grises ultra-minimalistas
        gray: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#09090B',
        },
        // Acentos Funcionales
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9', // Sky Blue Moderno
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        accent: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4', // Cyan Accent
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
        // Estados
        success: {
          50: '#ECFDF5',
          500: '#10B981',
          700: '#047857',
        },
        danger: {
          50: '#FEF2F2',
          500: '#EF4444',
          700: '#B91C1C',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B',
          700: '#B45309',
        },
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'xs': ['11px', { lineHeight: '16px', letterSpacing: '-0.01em' }],
        'sm': ['13px', { lineHeight: '18px', letterSpacing: '-0.011em' }],
        'base': ['14px', { lineHeight: '20px', letterSpacing: '-0.014em' }],
        'lg': ['16px', { lineHeight: '24px', letterSpacing: '-0.016em' }],
        'xl': ['18px', { lineHeight: '26px', letterSpacing: '-0.017em' }],
        '2xl': ['22px', { lineHeight: '30px', letterSpacing: '-0.019em' }],
        '3xl': ['28px', { lineHeight: '36px', letterSpacing: '-0.021em' }],
        '4xl': ['34px', { lineHeight: '40px', letterSpacing: '-0.022em' }],
        '5xl': ['44px', { lineHeight: '48px', letterSpacing: '-0.024em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'lg': '10px',
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.06)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      },
      transitionDuration: {
        'DEFAULT': '200ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
