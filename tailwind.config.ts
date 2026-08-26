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
        /*
         * The desktop panel grows out of its launcher — `origin-bottom-right`
         * on the panel puts the scale's anchor on the button it came from, so
         * the movement explains itself the way the sheet and drawer do.
         *
         * Opacity is finished by 55%, well before the transform is. A panel
         * that fades and moves on the same curve reads as arriving twice; this
         * way it is fully painted while it is still settling, which is what
         * makes the last few pixels feel like easing rather than lag.
         */
        'panel-in': {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.96)' },
          '55%': { opacity: '1' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // The mobile panel is a bottom sheet, so it comes from the edge it is
        // attached to rather than fading in place.
        'sheet-in': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        /*
         * Leaving. The counterpart of the two above, and the reason the panel
         * outlives its own close by one animation — see `closing` in
         * components/chat/quote-chat.tsx.
         *
         * These are the one exception to the no-fill rule above: an exit that
         * does not hold its last frame snaps back to a fully visible panel for
         * the frame between the animation ending and React unmounting it, which
         * is precisely the flash the animation exists to remove.
         *
         * Shorter than the entrances, and on an accelerating curve rather than
         * a decelerating one. Something arriving is worth watching; something
         * being dismissed has already been decided about, and a leisurely exit
         * is just a delay before the page is usable again.
         */
        'panel-out': {
          from: { opacity: '1', transform: 'translateY(0) scale(1)' },
          to: { opacity: '0', transform: 'translateY(6px) scale(0.97)' },
        },
        'sheet-out': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(100%)' },
        },
        /*
         * Navigation drawer. Same reasoning as the sheet above — it enters
         * from the edge it is anchored to, so the movement explains where the
         * panel came from and where "close" will send it back to.
         *
         * Slightly longer than the chat's transitions: this one crosses most
         * of the screen rather than a few pixels, and the same duration over a
         * much greater distance reads as a snap.
         */
        'drawer-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'scrim-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'turn-in': 'turn-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'controls-in': 'controls-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        // The panel is the one element here that changes the screen rather than
        // adding a line to it, so it gets a little longer than the ~250ms the
        // note above sets for turns and controls — at 220ms a scale that starts
        // at 0.96 arrives before the eye has followed it.
        'panel-in': 'panel-in 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'sheet-in': 'sheet-in 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'panel-out': 'panel-out 170ms cubic-bezier(0.4, 0, 1, 1) forwards',
        'sheet-out': 'sheet-out 200ms cubic-bezier(0.4, 0, 1, 1) forwards',
        'drawer-in': 'drawer-in 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scrim-in': 'scrim-in 220ms ease-out',
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
        /*
         * The quote chat is the documented exception, and it is named rather
         * than hand-rolled so it stays one exception instead of becoming the
         * beginning of a second, softer scale.
         *
         * It earns it by not being page furniture. The page is the contractor's
         * work — tape lines and flat slabs; the chat is a conversation floating
         * over it, and every convention a visitor has for that surface, from
         * every messaging app they own, is round. Square there does not read as
         * disciplined, it reads as unfinished. Nothing outside
         * components/chat/quote-chat.tsx may use these.
         */
        chat: '1rem',
        'chat-bubble': '0.875rem',
        'chat-control': '0.5rem',
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
