'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { GoogleMark, Stars } from '@/components/sections/review-parts';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Review } from '@/lib/content/types';

/** How long a review holds the frame before the track moves on. */
const INTERVAL = 5000;

/** Slack, in px, when deciding whether two cards share a resting position. */
const EPSILON = 2;

/** The same media-query-as-a-store the hero reel uses, for the same reason. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia('(prefers-reduced-motion: reduce)');
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    // The server cannot know, and guessing `true` would ship a dead carousel to
    // everyone. Autoplay only ever starts inside an effect, so the real answer
    // arrives before anything has moved.
    () => false,
  );
}

/** A square control, sized for touch, carrying the outline button's weight. */
function Control({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-md border border-paper-edge bg-white text-ink-soft transition-colors duration-200 hover:border-ink hover:text-ink"
    >
      <span className="sr-only">{label}</span>
      {children}
    </button>
  );
}

/**
 * The Google reviews, as a carousel.
 *
 * ## Why a scroll container rather than a transform
 *
 * The track is a genuinely scrolling element with CSS scroll snapping, and
 * every move — autoplay, arrows, dots — is a `scrollTo`. That buys touch
 * swiping, trackpad flicks, keyboard arrow keys and a sane reading order for
 * nothing, and it means the component holds no offset of its own that can drift
 * out of step with what is on screen: position is read back off `scrollLeft`
 * rather than remembered.
 *
 * It also degrades honestly. Before hydration — or if the bundle never arrives
 * — the section is a swipeable row of readable cards, which is a perfectly good
 * reviews wall. None of this is required for the content to be there.
 *
 * ## Where a card is allowed to stop
 *
 * Three cards are visible at `lg`, two at `sm`, one below that, and that count
 * is never named in JavaScript. `stops` is measured off the laid-out cards, so
 * the breakpoints live in the class list alone. Offsets that clamp to the same
 * final scroll position collapse into one, which is why the last two dots do
 * not exist on desktop — a dot that cannot move anything misrepresents what the
 * control does.
 *
 * ## When it moves by itself
 *
 * Every five seconds, and it holds still for any of five reasons: a mouse over
 * the carousel, keyboard focus inside it, the section scrolled off screen, a
 * backgrounded tab, or the visitor pressing pause. `prefers-reduced-motion`
 * suppresses autoplay outright, and the pause control with it — there is
 * nothing left to stop, and the arrows still work.
 *
 * Content that advances by itself past five seconds needs a way to stop it
 * (WCAG 2.2.2), which is the pause button. Hover and focus are the two that
 * matter in practice, because they are what someone does while reading.
 */
export function GoogleReviewCarousel({ reviews }: { reviews: readonly Review[] }) {
  const trackRef = useRef<HTMLUListElement>(null);

  /** Left offsets a card can actually rest at, measured from the DOM. */
  const [stops, setStops] = useState<readonly number[]>([]);
  const [active, setActive] = useState(0);

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [stoppedByUser, setStoppedByUser] = useState(false);

  const reduced = usePrefersReducedMotion();
  const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';

  const running =
    !reduced && !hovered && !focused && !stoppedByUser && onScreen && visible && stops.length > 1;

  /* ---------------------------------------------------------------- */
  /* Measurement                                                       */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const offsets = Array.from(track.children, (card) =>
        Math.min((card as HTMLElement).offsetLeft, max),
      );
      setStops(
        offsets.filter((left, index) => index === 0 || left - offsets[index - 1]! > EPSILON),
      );
    };

    measure();

    // The width changes here are the breakpoints firing and a scrollbar gutter
    // appearing, both of which move every card. More reliable than a window
    // resize listener, which misses a container resized by anything else.
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [reviews.length]);

  /* ---------------------------------------------------------------- */
  /* Position                                                          */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const track = trackRef.current;
    if (!track || stops.length === 0) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // The nearest stop, not the one that was asked for: a swipe, a flick
        // or an interrupted smooth scroll all end wherever they end.
        const left = track.scrollLeft;
        let nearest = 0;
        stops.forEach((stop, index) => {
          if (Math.abs(stop - left) < Math.abs(stops[nearest]! - left)) nearest = index;
        });
        setActive(nearest);
      });
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [stops]);

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track || stops.length === 0) return;
      // Wraps both ways, so neither arrow is ever a dead control.
      const wrapped = ((index % stops.length) + stops.length) % stops.length;
      track.scrollTo({ left: stops[wrapped]!, behavior });
      setActive(wrapped);
    },
    [stops, behavior],
  );

  /* ---------------------------------------------------------------- */
  /* Autoplay                                                          */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Nothing should be advancing behind six sections nobody can see it
    // through. A fifth of the track on screen counts as being read.
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(Boolean(entry?.isIntersecting)),
      { threshold: 0.2 },
    );
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // `active` is a dependency on purpose rather than by oversight: every move,
  // whoever made it, restarts the five seconds from where it landed. Without
  // that, a card reached by hand would inherit whatever was left of the
  // previous one's turn and could be gone in a few hundred milliseconds.
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => goTo(active + 1), INTERVAL);
    return () => window.clearInterval(timer);
  }, [running, goTo, active]);

  if (reviews.length === 0) return null;

  return (
    <div
      aria-roledescription="carousel"
      aria-label="Reviews from APMG’s Google Business Profile"
      // Mouse only. A tap fires `pointerenter` on touch and never fires the
      // matching leave, which would park the carousel for the rest of the
      // visit. The leave is unconditional, so a mouse that departs by way of a
      // scroll or a window switch still releases it.
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <ul
        ref={trackRef}
        // A scrollable region is only operable from the keyboard if it can be
        // focused, and a focusable region needs a name.
        tabIndex={0}
        aria-label="Google reviews"
        // Off while it moves on its own: a reader being told about a card it
        // did not ask for, every five seconds, is noise. Paused — which is what
        // hovering or focusing does — every move is deliberate and worth
        // announcing.
        aria-live={running ? 'off' : 'polite'}
        className={cn(
          'flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain py-1',
          // The row is its own control surface; a scrollbar under it reads as a
          // second one. Swipe, arrows and dots all survive its removal.
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {reviews.map((review, index) => (
          <li
            key={review.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`Review ${index + 1} of ${reviews.length}`}
            className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
          >
            {/* figure/blockquote/figcaption is the house pattern for an
                attributed quotation — see TestimonialBlock. A <footer> here
                would scope to the section, not the card, and put seven of them
                on the page. */}
            <Card className="gap-3">
              <figure className="flex h-full flex-col gap-3">
                <Stars rating={review.rating} />
                <blockquote className="text-sm leading-relaxed text-ink-soft">
                  &ldquo;{review.quote}&rdquo;
                </blockquote>
                {/* Every card is as tall as the longest quote, because they sit
                    in one flex row. `mt-auto` spends that difference below the
                    quote rather than above the attribution, so the rule lands
                    on the card's own bottom edge in all of them. */}
                <figcaption className="mt-auto flex items-center gap-2 border-t border-paper-edge pt-3 text-xs text-ink-muted">
                  <GoogleMark className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    <span className="font-semibold text-ink">{review.attribution}</span>
                    {review.organisation && <span> · {review.organisation}</span>}
                    <span className="block">on {review.source}</span>
                  </span>
                </figcaption>
              </figure>
            </Card>
          </li>
        ))}
      </ul>

      {/* ---------------------------------------------------------------- */}
      {/* Controls                                                          */}
      {/* ---------------------------------------------------------------- */}
      {/* The row is rendered from the first paint, so hydration cannot resize
          the section under someone mid-read. Only the dots wait on the
          measurement, because only they depend on it. */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <ul className="flex flex-wrap items-center gap-1">
          {stops.map((_, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-current={index === active}
                // A 8px dot in a 40px target: the hit area is the control, the
                // dot is only the part of it that is drawn.
                className="flex h-10 w-6 items-center justify-center"
              >
                <span className="sr-only">Go to review {index + 1}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors duration-300',
                    index === active ? 'bg-brand-600' : 'bg-paper-edge',
                  )}
                />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Control label="Previous review" onClick={() => goTo(active - 1)}>
            <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
              <path d="M8.5 0L10 1.5 5.5 6 10 10.5 8.5 12 2.5 6z" />
            </svg>
          </Control>

          {/* Under reduced motion nothing advances, so a stop control would be
              a button that does nothing to something that is not happening. */}
          {!reduced && (
            <Control
              label={stoppedByUser ? 'Play reviews' : 'Pause reviews'}
              onClick={() => setStoppedByUser((stopped) => !stopped)}
            >
              {stoppedByUser ? (
                <svg aria-hidden="true" viewBox="0 0 12 14" className="h-3 w-3" fill="currentColor">
                  <path d="M0 0l12 7-12 7z" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 12 14" className="h-3 w-3" fill="currentColor">
                  <rect x="0" y="0" width="4" height="14" />
                  <rect x="8" y="0" width="4" height="14" />
                </svg>
              )}
            </Control>
          )}

          <Control label="Next review" onClick={() => goTo(active + 1)}>
            <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
              <path d="M3.5 0L2 1.5 6.5 6 2 10.5 3.5 12 9.5 6z" />
            </svg>
          </Control>
        </div>
      </div>
    </div>
  );
}
