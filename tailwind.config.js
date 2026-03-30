/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#080a0f',
          900: '#0d1117',
          800: '#161b22',
          700: '#21262d',
          600: '#30363d',
          500: '#484f58',
          400: '#6e7681',
          300: '#8b949e',
          200: '#b1bac4',
          100: '#c9d1d9',
          50:  '#f0f6fc',
        },
        amber: {
          950: '#2d1a00',
          900: '#451f00',
          800: '#6b3500',
          700: '#9a4e00',
          600: '#c86a00',
          500: '#f59e0b',
          400: '#fbbf24',
          300: '#fcd34d',
          200: '#fde68a',
          100: '#fef3c7',
          50:  '#fffbeb',
        },
        crimson: {
          500: '#dc2626',
          400: '#f87171',
          300: '#fca5a5',
        },
        teal: {
          500: '#0d9488',
          400: '#2dd4bf',
          300: '#5eead4',
        },
        violet: {
          500: '#7c3aed',
          400: '#a78bfa',
          300: '#c4b5fd',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      animation: {
        'node-appear': 'nodeAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-amber': 'pulseAmber 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        nodeAppear: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseAmber: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(245, 158, 11, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      boxShadow: {
        'node': '0 4px 24px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)',
        'node-selected': '0 0 0 2px #f59e0b, 0 8px 32px rgba(245,158,11,0.3)',
        'panel': '4px 0 24px rgba(0,0,0,0.5)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.25)',
      },
    },
  },
  plugins: [],
}
