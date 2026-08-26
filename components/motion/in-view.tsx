'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Runs a looping CSS animation only while its subject is on screen.
 *
 * A wrapper that writes `data-inview="false"` when the element it wraps is out
 * of the viewport, and `"true"` when it is not. Stylesheets pause on the false
 * case (see `.process-rail` in app/globals.css). Nothing else here knows or
 * cares what the animation is.
 *
 * Three things it is careful about:
 *
 *  1. **Absent, not false, until measured.** The attribute is omitted on the
 *     server and for the first client frame, and CSS treats *absent* as
 *     running. A loop must never be left paused by a bundle that failed, an
 *     `IntersectionObserver` that does not exist, or the gap before hydration —
 *     the same rule the scroll reveal follows: nothing on this page may depend
 *     on JavaScript arriving to look finished.
 *
 *  2. **Paused, not reset.** `animation-play-state` freezes the loop where it
 *     stands, so a section scrolled away mid-cycle picks up rather than jumps.
 *     Because it is always paused *off* screen, the first sight of a section is
 *     reliably the start of the cycle.
 *
 *  3. **Off screen costs nothing.** A paused animation is not composited and
 *     not sampled, so the loop is free for however long the reader spends on
 *     the rest of the page.
 */
export function InView({
  children,
  className,
  /** Fraction of the subject that must be showing before it counts as seen. */
  threshold = 0.15,
}: {
  children: ReactNode;
  className?: string;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => setSeen(entries[entries.length - 1]?.isIntersecting ?? false),
      // A tall rail on a short viewport can never show 15% of itself and 100%
      // of the fold at once; `rootMargin` keeps it counted while it is the
      // thing being read.
      { threshold, rootMargin: '0px 0px -5% 0px' },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className={className} data-inview={seen === null ? undefined : String(seen)}>
      {children}
    </div>
  );
}
