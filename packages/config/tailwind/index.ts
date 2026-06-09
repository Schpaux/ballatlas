import type { Config } from 'tailwindcss'

// BallAtlas design tokens
// shadcn/ui HSL variables alongside the warm BallAtlas brand token layer
export const baseConfig: Partial<Config> = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // shadcn/ui — mapped via CSS HSL variables (keep for component compatibility)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // BallAtlas brand tokens — referenced via CSS custom properties
        paper: 'var(--ba-paper)',
        'paper-2': 'var(--ba-paper-2)',
        surface: 'var(--ba-surface)',
        ink: 'var(--ba-ink)',
        subtle: 'var(--ba-subtle)',
        ghost: 'var(--ba-ghost)',
        line: 'var(--ba-line)',
        'line-strong': 'var(--ba-line-strong)',
        // Green system
        'ba-green': {
          DEFAULT: 'var(--ba-green)',
          d: 'var(--ba-green-d)',
          l: 'var(--ba-green-l)',
          soft: 'var(--ba-green-soft)',
        },
        // Clay system
        'ba-clay': {
          DEFAULT: 'var(--ba-clay)',
          d: 'var(--ba-clay-d)',
          soft: 'var(--ba-clay-soft)',
        },
        sand: 'var(--ba-sand)',
        // Segment accent colors
        'seg-gold': 'var(--ba-gold)',
        'seg-gold-soft': 'var(--ba-gold-soft)',
        'seg-blue': 'var(--ba-seg-blue)',
        'seg-blue-soft': 'var(--ba-seg-blue-soft)',
        'seg-violet': 'var(--ba-seg-violet)',
        'seg-violet-soft': 'var(--ba-seg-violet-soft)',
        'seg-orange': 'var(--ba-seg-orange)',
        'seg-orange-soft': 'var(--ba-seg-orange-soft)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        rise: {
          to: { opacity: '1', transform: 'none' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'float-ball': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(3deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        rise: 'rise .72s cubic-bezier(.16,1,.3,1) forwards',
        blink: 'blink 1s ease-in-out infinite',
        'float-ball': 'float-ball 6s ease-in-out infinite',
      },
    },
  },
}
