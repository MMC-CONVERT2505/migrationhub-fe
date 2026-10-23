// @ts-nocheck
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colours are CSS variables (see index.css) so the public site can wear the MMC Convert
        // palette while the admin panel keeps the original one. `<alpha-value>` keeps /50 style modifiers working.
        bg: {
          DEFAULT: v('bg'),
          white: '#ffffff',
          light: v('bg-light'),
          lighter: v('bg-lighter'),
          muted: v('bg-muted'),
        },
        border: {
          DEFAULT: v('border'),
          medium: v('border-medium'),
          dark: v('border-dark'),
        },
        text: {
          primary: v('text-primary'),
          secondary: v('text-secondary'),
          tertiary: v('text-tertiary'),
        },
        blue: {
          50: v('blue-50'),
          100: v('blue-100'),
          200: v('blue-200'),
          300: v('blue-300'),
          400: v('blue-400'),
          500: v('blue-500'),
          600: v('blue-600'),
          700: v('blue-700'),
          800: v('blue-800'),
          900: v('blue-900'),
          950: v('blue-950'),
          DEFAULT: v('blue-600'),
          light: 'rgb(var(--blue-600) / 0.07)',
        },
        green: {
          DEFAULT: '#16a34a',
          light: 'rgba(22,163,74,0.08)',
        },
        red: {
          DEFAULT: '#dc2626',
        },
        amber: {
          DEFAULT: '#b45309',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0 2px 8px rgb(var(--blue-600) / 0.06)',
        'card-hover': '0 8px 24px rgb(var(--blue-600) / 0.14)',
        elevated: '0 4px 16px rgb(var(--blue-600) / 0.1)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        blink: 'blink 1.2s step-end infinite',
        'screen-enter': 'sc 0.4s ease both',
        'panel-enter': 'pIn 0.35s ease both',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        sc: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pIn: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
