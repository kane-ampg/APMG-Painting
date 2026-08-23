import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14181B',
          soft: '#3A4247',
          muted: '#697278',
        },
        paper: {
          DEFAULT: '#FFFFFF',
          sunken: '#F4F5F3',
          edge: '#E2E5E1',
        },
        // APMG's trade identity: deep slate-teal with a signal ochre.
        brand: {
          50: '#EDF3F3',
          100: '#D3E3E3',
          400: '#3D8A8E',
          600: '#155E62',
          700: '#0F4B4F',
          900: '#0A3134',
        },
        signal: {
          400: '#E0A33C',
          500: '#C4831A',
          600: '#9E6712',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};

export default config;
