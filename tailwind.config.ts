import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

/**
 * Map a CSS colour variable to a Tailwind colour that still honours opacity
 * modifiers (`bg-accent/15`). Plain `var(--x)` values silently drop them.
 */
const withAlpha = (name: string) =>
  `color-mix(in srgb, var(${name}) calc(<alpha-value> * 100%), transparent)`

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fill: withAlpha('--fill'),
        'fill-strong': withAlpha('--fill-strong'),
        control: withAlpha('--control'),
        btn: withAlpha('--btn'),
        'btn-hover': withAlpha('--btn-hover'),
        'control-border': withAlpha('--control-border'),
        'text-primary': withAlpha('--text-primary'),
        'text-secondary': withAlpha('--text-secondary'),
        'text-tertiary': withAlpha('--text-tertiary'),
        border: withAlpha('--border'),
        accent: withAlpha('--accent'),
        'accent-hover': withAlpha('--accent-hover'),
        'on-accent': withAlpha('--on-accent'),
        danger: withAlpha('--danger'),
        'danger-soft': withAlpha('--danger-soft'),
        success: withAlpha('--success'),
        /* Content placed straight on the wallpaper. */
        wp: withAlpha('--wp-fg'),
        'wp-secondary': withAlpha('--wp-fg-secondary'),
      },
      borderRadius: {
        widget: 'var(--radius-widget)',
        panel: 'var(--radius-panel)',
        menu: 'var(--radius-menu)',
        field: 'var(--radius-field)',
        row: 'var(--radius-row)',
        tile: 'var(--radius-tile)',
        control: 'var(--radius-control)',
      },
      boxShadow: {
        pop: 'var(--pop-shadow)',
        btn: 'var(--btn-shadow)',
      },
      fontSize: {
        micro: ['var(--text-micro)', { lineHeight: '1.3' }],
        caption: ['var(--text-caption)', { lineHeight: '1.35' }],
        body: ['var(--text-body)', { lineHeight: '1.4' }],
        callout: ['var(--text-callout)', { lineHeight: '1.35' }],
        title: ['var(--text-title)', { lineHeight: '1.3' }],
        display: ['var(--text-display)', { lineHeight: '1', letterSpacing: '-0.025em' }],
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
      /* Semantic stacking order; never use arbitrary z values. */
      zIndex: {
        widget: '10',
        chrome: '30',
        dropdown: '40',
        drawer: '50',
        modal: '60',
        toast: '70',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.22, 1, 0.36, 1)',
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        DEFAULT: '180ms',
        fast: '120ms',
        slow: '260ms',
      },
    },
  },
  plugins: [
    /* `glass:` targets the Liquid Glass material (`.glass-mode` on <html>). */
    plugin(({ addVariant }) => addVariant('glass', '.glass-mode &')),
  ],
} satisfies Config
