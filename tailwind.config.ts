import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1.25rem', screens: { '2xl': '1360px' } },
    extend: {
      colors: {
        // LunaQuest tokens
        space: '#070B14',
        surface: '#0D1422',
        well: '#0A101C',
        elevated: '#121D2E',
        line: { DEFAULT: '#243247', soft: '#1B273A', faint: '#172235', strong: '#2E3F58' },
        ink: { DEFAULT: '#F3F7FC', 2: '#C4CEDD', muted: '#91A0B7', faint: '#6F7D93' },
        cyan: { DEFAULT: '#5DE1FF', hover: '#8BEBFF', ink: '#04111A' },
        blue: { DEFAULT: '#739CFF' },
        success: '#57D9A3',
        warning: '#FFC66D',
        critical: { DEFAULT: '#FF6B78', soft: '#FF8A94' },
        // shadcn semantic tokens
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)', xl: '14px', '2xl': '18px' },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { label: '.14em' },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200px 0' }, '100%': { backgroundPosition: '200px 0' } },
      },
      animation: { shimmer: 'shimmer 1.4s linear infinite' },
    },
  },
  plugins: [animate],
};
export default config;
