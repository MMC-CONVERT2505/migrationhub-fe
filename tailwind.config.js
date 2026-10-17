// @ts-nocheck
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#f4f7fc',
          white: '#ffffff',
          light: '#f0f4fa',
          lighter: '#e8edf7',
          muted: '#dde4f0',
        },
        border: {
          DEFAULT: '#dce2ef',
          medium: '#c8d0e7',
          dark: '#b0bcd8',
        },
        text: {
          primary: '#111827',
          secondary: '#4b5568',
          tertiary: '#9ba3b8',
        },
        blue: {
          DEFAULT: '#2563eb',
          light: 'rgba(37,99,235,0.07)',
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
        card: '0 2px 8px rgba(37,99,235,0.06)',
        'card-hover': '0 8px 24px rgba(37,99,235,0.14)',
        elevated: '0 4px 16px rgba(37,99,235,0.1)',
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
