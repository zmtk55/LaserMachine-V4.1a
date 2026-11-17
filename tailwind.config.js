/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './components/**/*.{js,ts,jsx,tsx}',
    './*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        accent: Object.fromEntries([50,100,200,300,400,500,600,700,800,900,950].map(n => [n, `rgb(var(--lm-accent-${n}-rgb) / <alpha-value>)`])),
        yellow: Object.fromEntries([50,100,200,300,400,500,600,700,800,900,950].map(n=>[n,`rgb(var(--lm-accent-${n}-rgb) / <alpha-value>)`])),
        amber: Object.fromEntries([50,100,200,300,400,500,600,700,800,900,950].map(n=>[n,`rgb(var(--lm-accent-${n}-rgb) / <alpha-value>)`])),
        zinc: { 
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b' 
        },
        system: {
          primary: '#ffffff',
          secondary: '#f9fafb',
          tertiary: '#f3f4f6',
          inverse: '#111827',
          accent: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['var(--lm-font-ui)'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['var(--lm-font-display)'],
        vintage: ['Playfair Display', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.05em',
        tighter: '-0.02em',
        normal: '0',
        wide: '0.02em',
        wider: '0.05em',
      },
      aspectRatio: {
        product: '5 / 6',
      },
    },
  },
  plugins: [],
}
