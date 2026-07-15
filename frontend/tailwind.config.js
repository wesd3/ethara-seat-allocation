/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Accent scale — driven by CSS variables (see index.css), swappable at runtime.
        brand: {
          50: v('--brand-50'),
          100: v('--brand-100'),
          200: v('--brand-200'),
          300: v('--brand-300'),
          400: v('--brand-400'),
          500: v('--brand-500'),
          600: v('--brand-600'),
          700: v('--brand-700'),
          800: v('--brand-800'),
          900: v('--brand-900'),
        },
        // Neutral surface/text tokens — flip between light & dark.
        app: v('--app'),
        surface: v('--surface'),
        'surface-2': v('--surface-2'),
        line: v('--line'),
        'line-soft': v('--line-soft'),
        ink: v('--ink'),
        'ink-2': v('--ink-2'),
        muted: v('--muted'),
        faint: v('--faint'),
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)',
        hover: '0 8px 24px -6px rgb(16 24 40 / 0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .35s ease-out both',
        'pop-in': 'pop-in .2s ease-out both',
      },
    },
  },
  plugins: [],
}
