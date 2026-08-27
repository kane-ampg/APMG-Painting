'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * A media query as an external store, which is what it actually is.
 *
 * `null` on the server and on the hydrating render, because there is no honest
 * answer before there is a window — and rendering the video against a guess
 * would either mismatch or commit to a resolution the visitor's screen does not
 * want. React re-renders with the real value the moment hydration finishes,
 * which is also the earliest point at which loading video would have been a
 * good idea.
 */
function useMediaQuery(query: string): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}

/** Not in the DOM lib, and genuinely absent on Safari and Firefox. */
function prefersLessData(): boolean {
  if (typeof navigator === 'undefined') return false;
  const { connection } = navigator as Navigator & { connection?: { saveData?: boolean } };
  return Boolean(connection?.saveData);
}

/**
 * The homepage fold's background reel.
 *
 * This owns the moving layer and nothing else: the fold's copy and its proof
 * strip are passed straight through as `children` so they stay server
 * components. The only thing crossing the boundary is `--reel-progress`, set on
 * this element and read by the red cut line on the strip's top edge.
 *
 * ## What actually renders first
 *
 * The poster, always, as a `priority` next/image — it is the LCP element and it
 * paints before a byte of video is requested. The `<video>` never exists on the
 * server: it appears on the first render after hydration and fades over the
 * poster once it can play. The poster is the reel's own first frame, so the
 * swap is invisible.
 *
 * Deferring the element that far is what makes the three exits below possible,
 * and it is also how the 720p and 1080p encodes get chosen without relying on
 * `media` on `<source>`, which browsers have never agreed on.
 *
 * ## When the video does not load at all
 *
 * - `prefers-reduced-motion: reduce`. Twenty-nine seconds of hard cuts is
 *   exactly the content that setting exists to refuse.
 * - `navigator.connection.saveData`. An explicit ask not to be charged for
 *   decoration.
 * - Autoplay refused by the browser. Nothing is retried and no play button is
 *   forced on the visitor; the poster is a complete hero on its own.
 *
 * In all three the fold renders identically apart from the movement — same
 * crop, same scrim, same contrast — because everything legibility depends on
 * sits above the media layer rather than being baked into it.
 *
 * ## While it plays
 *
 * An IntersectionObserver pauses the video the moment the fold leaves the
 * screen and resumes it on the way back. The page below is long; a decoded
 * 1080p stream running behind eight sections nobody can see it through is pure
 * battery. The progress loop is rAF-driven and is torn down with it, so a
 * scrolled-past hero costs nothing at all.
 *
 * WCAG 2.2.2 requires a way to stop motion that runs past five seconds, so the
 * toggle in the top-right corner is a requirement rather than a flourish.
 * Pausing by hand is remembered against the observer — scrolling away and back
 * will not restart a reel the visitor stopped.
 */
export function HeroReel({
  poster,
  className,
  children,
}: {
  poster: { src: string; alt: string };
  className?: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  /** Set when the visitor uses the toggle, and never cleared by the observer. */
  const pausedByUser = useRef(false);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  // A 1080p encode on a phone buys detail nobody can resolve through a scrim.
  // The breakpoint is the same `lg` the fold's two-column layout turns on at.
  const wide = useMediaQuery('(min-width: 1024px)');

  /** null while the video must not load at all. See the note on the component. */
  const quality: 720 | 1080 | null =
    reduced === false && wide !== null && !prefersLessData() ? (wide ? 1080 : 720) : null;

  useEffect(() => {
    const video = videoRef.current;
    const root = rootRef.current;
    if (!video || !root) return;

    let frame = 0;

    const tick = () => {
      // `duration` is NaN until metadata lands and Infinity on a live stream.
      if (video.duration > 0 && Number.isFinite(video.duration)) {
        root.style.setProperty('--reel-progress', String(video.currentTime / video.duration));
      }
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      setPlaying(true);
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      setPlaying(false);
      cancelAnimationFrame(frame);
      frame = 0;
    };

    video.addEventListener('playing', start);
    video.addEventListener('pause', stop);

    // Autoplay is a promise that rejects rather than throws. A refusal is a
    // valid outcome here, not an error: the poster is already on screen.
    //
    // Playback needs BOTH gates before it starts, whichever opens second:
    // the idle deadline (so the encode never competes with the LCP poster and
    // hydration for bandwidth) AND visibility (the observer's initial entry —
    // without the visibility gate the observer's first callback started the
    // download one frame after mount, which defeated the idle deferral; and
    // without the idle gate a hero scrolled past before idle started playing
    // off-screen with the progress loop running). The user's pause outranks
    // both.
    let idleReached = false;
    let heroVisible = false;
    const tryPlay = () => {
      if (idleReached && heroVisible && !pausedByUser.current) {
        void video.play().catch(() => undefined);
      }
    };

    let idleId: number | undefined;
    const onIdle = () => {
      idleReached = true;
      tryPlay();
    };
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(onIdle, { timeout: 2000 });
    } else {
      idleId = window.setTimeout(onIdle, 800);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        heroVisible = entry.isIntersecting;
        if (!entry.isIntersecting) {
          video.pause();
        } else {
          tryPlay();
        }
      },
      // Any sliver of the fold still on screen counts as visible.
      { threshold: 0 },
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
      video.removeEventListener('playing', start);
      video.removeEventListener('pause', stop);
      cancelAnimationFrame(frame);
      if (idleId !== undefined) {
        if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
        else window.clearTimeout(idleId);
      }
    };
  }, [quality]);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      pausedByUser.current = false;
      void video.play().catch(() => undefined);
    } else {
      pausedByUser.current = true;
      video.pause();
    }
  }, []);

  return (
    <section
      ref={rootRef}
      className={cn(
        'hero-viewport relative isolate flex flex-col overflow-hidden bg-ink text-white',
        className,
      )}
    >
      {/* ---------------------------------------------------------------- */}
      {/* Media                                                             */}
      {/* ---------------------------------------------------------------- */}

      <div className="absolute inset-0 -z-10">
        <Image
          src={poster.src}
          alt={poster.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {quality !== null && (
          <video
            ref={videoRef}
            // The poster carries the description; the video repeats it.
            aria-hidden="true"
            muted
            loop
            playsInline
            // "metadata", not "auto": the play() call fetches what it needs
            // when it fires at idle; "auto" started the full download the
            // moment the element mounted.
            preload="metadata"
            disablePictureInPicture
            onCanPlay={() => setReady(true)}
            className={cn(
              'absolute inset-0 h-full w-full object-cover',
              // Long enough to read as the still resolving into motion rather
              // than as a second image arriving. No movement, so it is safe to
              // leave running under reduced motion — which never gets here.
              'transition-opacity duration-700 ease-out',
              ready ? 'opacity-100' : 'opacity-0',
            )}
          >
            <source src={`/video/hero-${quality}.mp4`} type="video/mp4" />
          </video>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Scrim                                                             */}
      {/* ---------------------------------------------------------------- */}
      {/*
       * Three layers, because the reel cuts between a hazy white skyline, a
       * street under overcast light, a fluorescent-lit office and a showroom
       * with a lime ceiling. Nothing that depends on one frame's exposure can
       * be trusted, so the copy sits on a floor that holds against the
       * brightest frame in the cut.
       *
       * The stops are measured against the copy column rather than chosen by
       * eye. Its right edge lands near 43% of the viewport at every width the
       * container clamps to, where the wash reads 0.80 — white on that is about
       * 9:1 even over pure white footage. It then falls away deliberately fast:
       * past 74% the video is all but untouched, which is the difference
       * between footage behind a headline and a black rectangle. The first
       * version of this graded far too slowly and turned the whole fold to mud.
       *
       * The desktop wash peaks at 16% rather than at the left edge, so it reads
       * as light thrown behind the copy instead of a black band bolted to the
       * side. That only matters past about 2000px, where the centred container
       * leaves a quarter of the screen to the left of the headline with nothing
       * in it; at that width the softer edge lets the footage carry the margin
       * rather than the margin swallowing the footage.
       */}

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-ink/10" />

      {/* Below lg the copy is stacked over the full width, so the wash runs up
          from the bottom edge instead of in from the left. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(15,17,19,0.35)_0%,rgba(15,17,19,0.62)_34%,rgba(15,17,19,0.8)_68%,rgba(15,17,19,0.9)_100%)] lg:hidden"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,rgba(15,17,19,0.86)_0%,rgba(15,17,19,0.9)_16%,rgba(15,17,19,0.88)_34%,rgba(15,17,19,0.8)_44%,rgba(15,17,19,0.5)_56%,rgba(15,17,19,0.16)_74%,rgba(15,17,19,0)_90%)] lg:block"
      />

      {/* The strip's own ground. Without it a bright frame under a translucent
          bar turns the proof figures to grey on grey. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent"
      />

      {children}

      {/* ---------------------------------------------------------------- */}
      {/* Pause                                                             */}
      {/* ---------------------------------------------------------------- */}
      {/*
       * Only rendered once a video exists to control. A stop button over a
       * still is a control that lies about what the page is doing.
       *
       * Square, because every corner on this site is. The blur is load-bearing
       * rather than decorative: this is the one control that sits directly on
       * moving footage with no scrim of its own.
       *
       * Top right, not bottom right. The floating quote chat is anchored to the
       * bottom-right corner of every page, and a second small square control
       * stacked above it read as a pair of widgets fighting for the same
       * corner. Up here it is also the corner a viewer already looks to for
       * playback, and it is clear of both the copy and the proof strip at every
       * width.
       *
       * `tight:` shrinks it. On a 360x640 phone the fold has about 50px of
       * slack in total and the centred copy rises to meet the corner, so at
       * 44px the control clipped the eyebrow. 36px still clears the 24px target
       * minimum, and the eyebrow drops a step at the same breakpoint.
       */}
      {quality !== null && ready && (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={!playing}
          className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center border border-white/30 bg-ink/50 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:right-8 sm:top-6 tight:right-3 tight:top-3 tight:h-9 tight:w-9"
        >
          <span className="sr-only">
            {playing ? 'Pause background video' : 'Play background video'}
          </span>
          {playing ? (
            <svg aria-hidden="true" viewBox="0 0 12 14" className="h-3.5 w-3" fill="currentColor">
              <rect x="0" y="0" width="4" height="14" />
              <rect x="8" y="0" width="4" height="14" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 12 14" className="h-3.5 w-3" fill="currentColor">
              <path d="M0 0l12 7-12 7z" />
            </svg>
          )}
        </button>
      )}
    </section>
  );
}
