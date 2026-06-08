/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand system (voteoffside.com) — FIFA Blue + Gold
        brand: {
          DEFAULT: '#1a56db',
          50:  '#eff4ff',
          100: '#dbe6fe',
          200: '#bfd3fe',
          300: '#93b4fd',
          400: '#608dfa',
          500: '#3b6bf6',
          600: '#1a56db',
          700: '#1846b0',
          800: '#193c8e',
          900: '#0f2260',
        },
        gold: {
          DEFAULT: '#f59e0b',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        success: '#16a34a',
        // Semantic surface tokens driven by CSS vars (light/dark)
        surface:  'rgb(var(--surface) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        ink:      'rgb(var(--ink) / <alpha-value>)',
        muted:    'rgb(var(--muted) / <alpha-value>)',
        line:     'rgb(var(--line) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 2px 8px rgba(16,24,40,0.06), 0 8px 32px rgba(16,24,40,0.08)',
        pop:     '0 8px 30px rgba(16,24,40,0.14)',
        glow:    '0 0 24px rgba(26,86,219,0.25)',
        'glow-gold': '0 0 20px rgba(245,158,11,0.3)',
        'brand':  '0 2px 12px rgba(26,86,219,0.35)',
        inner:   'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      borderRadius: {
        xl:  '0.9rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '20px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #1a56db 0%, #1846b0 100%)',
        'brand-gradient-vivid': 'linear-gradient(135deg, #2563eb 0%, #1a56db 50%, #1234a0 100%)',
        'gold-gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'dark-hero': 'linear-gradient(135deg, #0f1e4a 0%, #06100c 60%, #050e22 100%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(26,86,219,0.2)' },
          '50%':       { boxShadow: '0 0 28px rgba(26,86,219,0.45)' },
        },
        'score-pop': {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        // Hero background — GPU-only (transform + opacity), auto-skipped via motion-safe:
        'orb-drift-a': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '40%':      { transform: 'translate(-18px, 14px) scale(1.06)' },
          '70%':      { transform: 'translate(10px, -8px) scale(0.97)' },
        },
        'orb-drift-b': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '35%':      { transform: 'translate(14px, -12px) scale(1.05)' },
          '65%':      { transform: 'translate(-9px, 7px) scale(0.97)' },
        },
        // Diagonal light-sweep across the hero every ~14 s
        'hero-sweep': {
          '0%':         { transform: 'translateX(-110%) skewX(-18deg)', opacity: '0' },
          '4%':         { opacity: '0.06' },
          '46%':        { opacity: '0.06' },
          '50%, 100%':  { transform: 'translateX(260%) skewX(-18deg)', opacity: '0' },
        },
      },
      animation: {
        'fade-up':      'fade-up 0.4s ease-out both',
        'fade-in':      'fade-in 0.3s ease-out both',
        'glow-pulse':   'glow-pulse 2.5s ease-in-out infinite',
        'score-pop':    'score-pop 0.35s cubic-bezier(0.22,1,0.36,1)',
        'orb-drift-a':  'orb-drift-a 20s ease-in-out infinite',
        'orb-drift-b':  'orb-drift-b 25s ease-in-out infinite 3s',
        'hero-sweep':   'hero-sweep 14s ease-in-out infinite 6s',
      },
    },
  },
  plugins: [],
}
