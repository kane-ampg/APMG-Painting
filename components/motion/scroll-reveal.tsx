'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** How far each section travels, in px. Small on purpose. */
const DISTANCE = 24;

/**
 * Scroll reveal.
 *
 * One effect, applied once: every `[data-reveal]` element rises 24px and fades
 * in as it enters the viewport. Sections carry the attribute by default, so the
 * page reveals a block at a time rather than element by element — deliberately
 * quieter than a per-card cascade, which on a page this long reads as fidgety
 * by the third screen.
 *
 * Four things this is careful about, in order of how badly they would hurt:
 *
 *  1. **No stylesheet ever hides anything.** The hidden start state is written
 *     by JavaScript, after GSAP has loaded and run. If the bundle fails, is
 *     blocked, or throws, every section renders normally. On a site whose whole
 *     purpose is organic traffic, a stylesheet that sets `opacity: 0` and waits
 *     for JS is a way to lose the entire page.
 *
 *  2. **Only what is below the fold is touched.** Anything already on screen
 *     when GSAP initialises is left exactly as it is. Hiding it in order to
 *     animate it back would be a visible flash, and there is nothing to reveal
 *     on a scroll that has not happened. This is also why the start state is
 *     set here rather than left to `gsap.from()`: `from` would snap a section
 *     to invisible only once it had already crossed the trigger line, with a
 *     sliver of it on screen.
 *
 *  3. **GSAP loads after hydration.** The dynamic import keeps it out of the
 *     initial bundle, so first paint and LCP are unchanged. The hero does not
 *     use `Section`, so nothing above the fold waits on this.
 *
 *  4. **Reduced motion means no motion.** `gsap.matchMedia` registers the
 *     animation only under `(prefers-reduced-motion: no-preference)`. The
 *     global `0.01ms` override in globals.css cannot help here — that rule
 *     governs CSS transitions and animations, and GSAP writes inline styles, so
 *     it would sail straight through. Under `reduce` nothing is hidden and no
 *     tween is created.
 */
export function ScrollReveal() {
  // Re-run per route: a client navigation swaps the DOM, so the previous
  // route's triggers point at detached nodes.
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Anything already on screen has nothing to reveal. Measured once,
        // before a single style is written, so the partition is honest.
        const pending = gsap.utils
          .toArray<HTMLElement>('[data-reveal]')
          .filter((el) => el.getBoundingClientRect().top > window.innerHeight);

        if (pending.length === 0) return;

        gsap.set(pending, { autoAlpha: 0, y: DISTANCE });

        const batch = ScrollTrigger.batch(pending, {
          // Slightly inside the fold, so a section is settling by the time it
          // is properly readable rather than animating under the nose.
          start: 'top 88%',
          once: true,
          onEnter: (elements) =>
            gsap.to(elements, {
              y: 0,
              autoAlpha: 1,
              duration: 0.6,
              ease: 'power2.out',
              // Only bites when two short sections cross the line together.
              stagger: 0.08,
              overwrite: true,
              // Hand the element back with no inline styles of ours on it.
              clearProps: 'opacity,visibility,transform',
            }),
        });

        return () => {
          batch.forEach((trigger) => trigger.kill());
          // matchMedia's revert restores what gsap.set wrote, but be explicit:
          // a section must never be left hidden by a teardown.
          gsap.set(pending, { clearProps: 'opacity,visibility,transform' });
        };
      });

      cleanup = () => mm.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [pathname]);

  return null;
}
