/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Noto Sans Devanagari"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        numeric: ['Roboto', 'Inter', '-apple-system', 'sans-serif'],
        tabular: ['Roboto', 'Inter', 'monospace'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        deva: ['"Noto Sans Devanagari"', 'Inter', 'sans-serif']
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.9375rem', letterSpacing: '-0.01em' }], // 11px
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.01em' }],          // 12px
        'sm': ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em' }],     // 13px
        'base': ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '-0.011em' }],  // 14px
        'md': ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '-0.015em' }],     // 15px
        'lg': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.015em' }],          // 16px
        'xl': ['1.125rem', { lineHeight: '1.625rem', letterSpacing: '-0.02em' }],     // 18px
        '2xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],     // 20px
        '3xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],         // 24px
        '4xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.03em' }],     // 30px
        '5xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.035em' }],      // 36px
      },
      colors: {
        railway: {
          dark: '#07101E',
          navy: '#003366',
          deepblue: '#002244',
          blue: '#005691',
          sky: '#0284C7',
          accent: '#0284C7',
          light: '#F8FAFC',
          green: '#15803D',
          emerald: '#059669',
          yellow: '#D97706',
          amber: '#B45309',
          red: '#DC2626',
          overload: '#991B1B'
        }
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.07)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)'
      },
      borderRadius: {
        'none': '0px',
        'xs': '2px',
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px'
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
