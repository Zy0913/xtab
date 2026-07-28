import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-strong': 'var(--surface-strong)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-soft)',
        'danger-border': 'var(--danger-border)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        btn: 'var(--radius-btn)',
        tile: 'var(--radius-tile)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
        glow: 'var(--shadow-glow)',
      },
      fontSize: {
        display: ['var(--text-display)', { lineHeight: '1', letterSpacing: '-0.03em' }],
        caption: ['var(--text-caption)', { lineHeight: '1.35' }],
        micro: ['var(--text-micro)', { lineHeight: '1.35' }],
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"PingFang SC"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config
