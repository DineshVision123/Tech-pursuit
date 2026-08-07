import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05070d',
          900: '#0a0e1a',
          800: '#0f1424',
          700: '#161d33',
          600: '#212a45',
          500: '#374262',
          400: '#5b6688',
          300: '#8891ab',
          200: '#b8bfd1',
          100: '#e2e5ee',
          50: '#f5f6fa',
        },
        brand: {
          950: '#050e2e',
          900: '#081340',
          800: '#0b1c5c',
          700: '#0f2a80',
          600: '#1341a8',
          500: '#1d5bd6',
          400: '#3b7cf0',
          300: '#6da3f7',
          200: '#a4c6fb',
          100: '#d3e3fd',
          50: '#eef4ff',
        },
        gold: {
          900: '#7a3a05',
          800: '#95470a',
          700: '#b6560c',
          600: '#d9680e',
          500: '#f4841a',
          400: '#f8a13f',
          300: '#fabd6e',
          200: '#fcd6a0',
          100: '#feead0',
          50: '#fff6e9',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f6f8fc',
          muted: '#eef1f8',
        },
      },
      fontFamily: {
        // One family for the whole site — `display` and `body` are kept as
        // separate keys only so existing className call sites don't need
        // touching, but both resolve to the same Inter Variable instance.
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-glow':
          'radial-gradient(60% 50% at 50% 0%, rgba(29,91,214,0.25) 0%, rgba(5,7,13,0) 60%)',
        'brand-radial':
          'radial-gradient(circle at 30% 20%, rgba(61,124,240,0.35), transparent 55%)',
        'gold-radial':
          'radial-gradient(circle at 70% 30%, rgba(244,132,26,0.3), transparent 55%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px -20px rgba(29,91,214,0.45)',
        'glow-gold': '0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px -20px rgba(244,132,26,0.45)',
        card: '0 1px 0 rgba(15,20,36,0.04), 0 20px 40px -24px rgba(15,20,36,0.18)',
      },
      animation: {
        'spin-slow': 'spin 14s linear infinite',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 32s linear infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'hero-fade-in': 'hero-fade-in 900ms ease-out both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'hero-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      maxWidth: {
        content: '1320px',
      },
    },
  },
  plugins: [],
};

export default config;
