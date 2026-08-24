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
        // APMG black. The dominant dark surface *and* the body text colour, so
        // it stays a true neutral — no blue or green cast to fight the red.
        ink: {
          DEFAULT: '#0F1113',
          raised: '#1B1E21',
          soft: '#3A3E42',
          muted: '#6B7075',
        },
        paper: {
          DEFAULT: '#FFFFFF',
          sunken: '#F5F5F5',
          edge: '#E3E3E4',
        },
        // APMG red — the only accent. 600 is the lightest step that still
        // clears 4.5:1 on white, so it is the floor for red text and icons.
        brand: {
          50: '#FDF2F3',
          100: '#FADDE1',
          400: '#E24356',
          500: '#D8172F',
          600: '#C8102E',
          700: '#A50C25',
          900: '#6B0718',
        },
        // Deliberately outside the black/red palette: preview-build banners and
        // "awaiting content" markers must not read as brand furniture. These
        // disappear when the sandbox flags come off.
        signal: {
          400: '#E0A33C',
          500: '#C4831A',
          600: '#8A5A0F',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      screens: {
        // Height-keyed, not width-keyed. The homepage fold has to hold its
        // whole offer inside one viewport, and a 1366x768 laptop gives it
        // ~620px to do that in — less than a phone. `short:` is where the fold
        // tightens its rhythm instead of growing past the screen.
        short: { raw: '(max-height: 760px)' },
        // Short *and* narrow: a small phone, where the fold is tighter than
        // anywhere else. Declared after `short` so it wins where both match.
        tight: { raw: '(max-height: 760px) and (max-width: 639px)' },
      },
      /*
       * Chat motion.
       *
       * Short and small on purpose. The chat asks a question per tap, so the
       * transition has to read as the next turn arriving, not as a screen
       * changing — anything above ~250ms or ~8px starts to feel like waiting.
       * One shared ease (a decelerating curve, the CSS equivalent of GSAP's
       * power2.out used by ScrollReveal) so the whole surface moves alike.
       *
       * No fill mode, for two reasons. A forwards fill would leave a transform
       * permanently applied to every bubble in the transcript, making each one
       * a containing block for the rest of the session to no purpose. And with
       * no fill an element that never animates — motion disabled, a future
       * override, an animation that simply does not start — renders at its
       * normal, visible style rather than at a keyframe's `opacity: 0`. That is
       * the rule ScrollReveal follows too: nothing is hidden while waiting on
       * motion to happen. The cost is a possible single-frame flash of the
       * settled state, which at 6px and 220ms is not perceptible.
       */
      keyframes: {
        'turn-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'controls-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'panel-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // The mobile panel is a bottom sheet, so it comes from the edge it is
        // attached to rather than fading in place.
        'sheet-in': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'turn-in': 'turn-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'controls-in': 'controls-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'panel-in': 'panel-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'sheet-in': 'sheet-in 260ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      /*
       * Corners.
       *
       * Square, deliberately, and set here rather than by editing sixty
       * scattered `rounded-*` utilities: this is one decision in one place,
       * every component keeps expressing its existing intent, and reversing it
       * is a single diff rather than an archaeology exercise.
       *
       * A painting contractor's work is masking tape, straight edges and cut
       * lines. Soft corners on the cards read as generic SaaS and fight the
       * black-and-red palette, which is at its best when it is structural —
       * hard rules, flat slabs, no softening.
       *
       * `full` survives untouched: the two places using it are genuine circles,
       * not softened rectangles.
       */
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '9999px',
      },

      letterSpacing: {
        // The one uppercase micro-label tracking. Everything that sets small
        // caps uses this; nothing hand-rolls a second value.
        label: '0.14em',
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};

export default config;
