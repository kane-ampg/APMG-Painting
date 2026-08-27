import Image from 'next/image';
import Link from 'next/link';
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { ProcessIcon, type ProcessIconName } from '@/components/icons/process-icons';
import { SectorIcon } from '@/components/icons/sector-icons';
import { HeroReel } from '@/components/media/hero-reel';
import { InView } from '@/components/motion/in-view';
import { GoogleReviewCarousel } from '@/components/sections/google-review-carousel';
import { GoogleMark, Stars } from '@/components/sections/review-parts';
import {
  ButtonLink,
  Card,
  Container,
  Eyebrow,
  mediaZoom,
  microLabel,
  SectionHeading,
  Section,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { site } from '@/lib/site';
import {
  averageRating,
  firstPartyReviews,
  googleAggregate,
  googleReviews,
} from '@/content/reviews';
import { displayName, getRegion, stateSlug, type Locality } from '@/lib/locations';
import type { Faq, Project, Sector, Service } from '@/lib/content/types';

/* ------------------------------------------------------------------ */
/* Hero                                                                 */
/* ------------------------------------------------------------------ */

export function Hero({
  eyebrow,
  heading,
  lede,
  primaryCta,
  secondaryCta,
  showPhone = false,
  image,
}: {
  eyebrow?: string;
  heading: string;
  lede: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Adds a tap-to-call line under the buttons. */
  showPhone?: boolean;
  image?: { src: string; alt: string };
}) {
  return (
    <section className="border-b border-paper-edge bg-paper-sunken">
      <Container width="wide">
        <div className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h1 className="text-balance font-display text-4xl leading-[1.08] tracking-tight text-ink sm:text-5xl">
              {heading}
            </h1>
            <p className="mt-5 max-w-prose text-lg text-ink-soft">{lede}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink>
              {secondaryCta && (
                <ButtonLink href={secondaryCta.href} variant="outline">
                  {secondaryCta.label}
                </ButtonLink>
              )}
            </div>
            {showPhone && (
              <p className="mt-5 text-sm text-ink-soft">
                Or call{' '}
                <a
                  href={site.phone.href}
                  className="font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  {site.phone.display}
                </a>{' '}
                — Monday to Friday.
              </p>
            )}
          </div>

          {image && (
            <div className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-paper-edge">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                // Above the fold on every page that uses it.
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className={`object-cover ${mediaZoom}`}
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Home hero — the site's one full-viewport fold                        */
/* ------------------------------------------------------------------ */

/**
 * The homepage fold, and the only hero on the site that claims a whole
 * viewport. `.hero-viewport` (globals.css) sizes it to exactly the space under
 * the sticky header, which is what puts the proof strip *on* the fold's bottom
 * edge rather than just below it. That edge is doing real work: it is the cue
 * that there is more page, on the one screen that has to carry the offer, both
 * audience paths, a way to call and a reason to believe any of it.
 *
 * The fold is a reel now, not a photograph. Twenty-nine seconds of APMG's own
 * footage runs full-bleed behind the copy — Docklands from the air, the
 * branded vans on a shopping strip, an open-plan office being repainted around
 * the desks, a stairwell, a retail showroom — and the whole thing is the claim
 * in the headline demonstrated rather than asserted. Every shot in the cut is
 * commercial, and the cut ends where the master stops being so — the last
 * fifteen seconds are on the cutting-room floor for the same reason the page
 * they would have suited is gone. There is a unit test in tests/unit/ holding
 * that line across the source; this is the same rule applied to footage — and
 * it is enforced in scripts/encode-hero-video.mjs, which is where the cut
 * length is set.
 *
 * `HeroReel` owns the media, the scrim and the pause control. It takes this
 * copy as children so none of it becomes client JavaScript, and hands back one
 * value across the boundary: `--reel-progress`, which drives the red line on
 * the strip's top edge.
 *
 * Copy over footage is the arrangement the still version could not support. A
 * scrim heavy enough to carry white text at 360px wide left nothing of a
 * photograph, so the photograph got its own band instead. A cut that moves
 * survives the same scrim — there is always another frame — which is what lets
 * the fold finally be one image rather than two panels.
 *
 * Kept separate from `Hero` deliberately. Every other page wants a compact
 * header it can scroll past, and a shared component that did both would be
 * mostly branches.
 */
export function HomeHero({
  eyebrow,
  heading,
  headingAccent,
  lede,
  primaryCta,
  secondaryCta,
  proof,
  poster,
  scrollTo,
}: {
  eyebrow: string;
  /** Opening of the h1, set in white. */
  heading: string;
  /** Closing phrase of the h1, carried in red. Splitting it is what stops the
   *  headline reading as one undifferentiated block at display size. */
  headingAccent: string;
  lede: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  /** Figures for the strip on the fold's bottom edge. Facts only — every one
   *  of these is stated at length further down the page. */
  proof: readonly { figure: string; label: string }[];
  /** The reel's own first frame. It is the LCP element, and it is what the
   *  fold falls back to whenever the video does not load. */
  poster: { src: string; alt: string };
  scrollTo: { label: string; href: string };
}) {
  return (
    <HeroReel poster={poster}>
      <div className="relative z-10 flex flex-1 items-center">
        <Container width="wide">
          <div className="grid py-10 sm:py-12 lg:grid-cols-2 lg:py-16 short:py-8 tight:py-6">
            <div className="lg:pr-12">
              {/* A step down on the tightest phones, where the pause control
                  in the opposite corner comes within a few pixels of this line
                  and the label would otherwise run under it. */}
              <p
                className={cn(
                  microLabel,
                  'flex items-center gap-3 text-brand-400 tight:text-[0.625rem]',
                )}
              >
                <span aria-hidden="true" className="h-px w-8 bg-brand-500" />
                {eyebrow}
              </p>

              {/*
               * Larger than the still version carried, because the fold is one
               * image now rather than a copy panel beside a photograph — the
               * headline is competing with moving footage for the first second
               * of attention and has to win it.
               *
               * The shadow is offset and softly blurred rather than a halo. It
               * is insurance against the two brightest frames in the cut, the
               * hazy skyline and the fluorescent-lit office, either of which
               * can sit behind the descenders when the loop restarts.
               */}
              <h1 className="mt-4 text-balance font-display text-[2.15rem] leading-[1.05] tracking-tight [text-shadow:0_2px_28px_rgba(15,17,19,0.6)] sm:text-[3rem] lg:text-[3.3rem] xl:text-[3.7rem] short:text-[2.5rem] sm:short:text-[3rem] tight:text-[1.85rem]">
                {heading} <span className="text-brand-400">{headingAccent}</span>
              </h1>

              <p className="mt-5 max-w-lg text-base text-white/85 [text-shadow:0_1px_16px_rgba(15,17,19,0.7)] sm:text-lg short:mt-4 short:text-base tight:text-sm">
                {lede}
              </p>

              <div className="mt-7 flex flex-wrap gap-3 short:mt-5">
                <ButtonLink href={primaryCta.href} variant="accent">
                  {primaryCta.label}
                </ButtonLink>
                <ButtonLink href={secondaryCta.href} variant="ghostLight">
                  {secondaryCta.label}
                </ButtonLink>
              </div>

              <p className="mt-5 text-sm text-white/80 [text-shadow:0_1px_16px_rgba(15,17,19,0.7)] short:mt-4">
                Or call{' '}
                <a
                  href={site.phone.href}
                  className="rounded font-semibold text-white underline decoration-brand-500 decoration-2 underline-offset-4 hover:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  {site.phone.display}
                </a>{' '}
                — Monday to Friday.
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* The fold's bottom edge. Translucent so the reel continues behind it
          rather than being cut off by a solid bar. */}
      <div className="relative z-10 bg-ink/70 backdrop-blur-sm">
        {/*
         * The rule along this edge was already the seam between the fold and
         * the rest of the page. It is now also the reel's own clock: the red
         * line lays itself along the white one over the length of the loop and
         * starts again with it — the cut line every job on this site begins
         * with, drawn at the speed of the footage above it.
         *
         * `--reel-progress` is 0 until a video is actually playing, so under
         * reduced motion, a refused autoplay, or the reel paused by hand, the
         * red is simply not there and the white rule is the whole edge, exactly
         * as it was.
         */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-white/15" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5 origin-left bg-brand-500"
          style={{ transform: 'scaleX(var(--reel-progress, 0))' }}
        />

        <Container width="wide">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-3.5 sm:py-5">
            {/* Stacked into three columns on phones, back onto one baseline
                from sm — a wrapping figure/label pair costs the fold more
                height than it can spare. */}
            <ul className="grid w-full grid-cols-3 gap-x-4 sm:flex sm:w-auto sm:flex-wrap sm:items-baseline sm:gap-x-7 sm:gap-y-2">
              {proof.map((item) => (
                <li
                  key={item.label}
                  className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2"
                >
                  <span className="font-display text-base tracking-tight sm:text-lg">
                    {item.figure}
                  </span>
                  <span className={cn(microLabel, 'text-[0.625rem] text-white/70 sm:text-xs')}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>

            <a
              href={scrollTo.href}
              className="group hidden items-center gap-2 rounded text-sm font-semibold text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 lg:inline-flex"
            >
              {scrollTo.label}
              <span
                aria-hidden="true"
                className="transition-transform duration-300 ease-out group-hover:translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
              >
                &#8595;
              </span>
            </a>
          </div>
        </Container>
      </div>
    </HeroReel>
  );
}

/* ------------------------------------------------------------------ */
/* Cards: services, sectors, projects                                   */
/* ------------------------------------------------------------------ */

/**
 * What we paint, as photographs first.
 *
 * This grid used to be five text-only cards, and it was the weakest block on
 * the site: the one section describing a visual trade with nothing visual in
 * it. The photographs are work in progress — a pole roller in an occupied
 * office, a boom lift against a warehouse wall — because a facilities manager
 * reads competence off the set-up, the sheeting and the access equipment, not
 * off a finished wall that any painter can photograph.
 *
 * It is no longer an even three-column grid, for two reasons. Five services
 * into three columns left an orphan row of two, and the identical
 * `sm:grid-cols-2 lg:grid-cols-3` shape runs three times down the homepage —
 * here, then the sectors, then the projects. So the first service leads at the
 * full width of the row with its photograph taking half the card, and the
 * remaining four run beneath it, four across.
 *
 * Nothing is hidden behind an interaction. A carousel would have put three of
 * the five services behind a click on the one section that answers what the
 * company actually does, and the page already carries one at the review wall.
 *
 * The lead is `services[0]` rather than a slug named here, so reordering
 * content/services.ts is what changes which service gets the large card.
 *
 * Cards are not links. Services do not each have a page, so the frame carries
 * the house photo zoom and nothing else that would imply somewhere to click;
 * `image` stays optional so a service without a photograph still renders as
 * the plain card it used to be.
 */
export function ServiceGrid({ services }: { services: readonly Service[] }) {
  if (services.length === 0) return null;

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {services.map((service, index) => {
        const lead = index === 0;

        return (
          <li key={service.slug} className={cn(lead && 'sm:col-span-2 lg:col-span-4')}>
            <article
              className={cn(
                'group relative flex h-full flex-col overflow-hidden rounded-lg border border-paper-edge bg-white',
                lead && 'lg:flex-row',
              )}
            >
              {service.image && (
                <div
                  className={cn(
                    'relative aspect-[16/9] overflow-hidden bg-ink',
                    lead && 'lg:aspect-[3/2] lg:w-1/2 lg:shrink-0',
                  )}
                >
                  <Image
                    src={service.image.src}
                    alt={service.image.alt}
                    fill
                    loading="lazy"
                    sizes={
                      lead
                        ? '(min-width: 1024px) 50vw, 100vw'
                        : '(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw'
                    }
                    className={`object-cover ${mediaZoom}`}
                  />
                </div>
              )}
              <div
                className={cn(
                  'flex flex-1 flex-col gap-3 p-5',
                  lead && 'gap-4 p-6 lg:justify-center lg:p-10',
                )}
              >
                <h3
                  className={cn(
                    'font-display text-lg tracking-tight',
                    lead && 'text-2xl lg:text-3xl',
                  )}
                >
                  {service.title}
                </h3>
                <p
                  className={cn(
                    'flex-1 text-sm text-ink-soft',
                    lead && 'max-w-prose flex-none text-base',
                  )}
                >
                  {service.summary}
                </p>
                {lead && service.body[0] && (
                  <p className="hidden max-w-prose text-sm text-ink-soft lg:block">
                    {service.body[0]}
                  </p>
                )}
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {service.includes.slice(0, lead ? 5 : 3).map((item) => (
                    <li
                      key={item}
                      className="rounded bg-paper-sunken px-2 py-1 text-xs font-medium text-ink-soft"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Where we work, as eight cards.
 *
 * Each card leads with a glyph rather than a photograph: three of these eight
 * sectors have a project behind them and five do not, and a stock building
 * would read as a job we did. See components/icons/sector-icons.
 */
export function SectorGrid({ sectors }: { sectors: readonly Sector[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sectors.map((sector) => (
        <Card
          as="li"
          key={sector.slug}
          className="gap-3 transition-[border-color,box-shadow] duration-300 ease-out focus-within:border-brand-600 hover:border-brand-600 hover:shadow-lg hover:shadow-ink/10 motion-reduce:transition-none"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
            <SectorIcon slug={sector.slug} className="h-7 w-7" />
          </span>
          <h3 className="font-display text-lg tracking-tight">
            <Link
              href={sector.legacyPath}
              className="rounded after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              {sector.shortTitle}
            </Link>
          </h3>
          <p className="flex-1 text-sm text-ink-soft">{sector.intro}</p>
          {sector.projectSlugs.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-label text-brand-600">
              {sector.projectSlugs.length} case{' '}
              {sector.projectSlugs.length === 1 ? 'study' : 'studies'}
            </p>
          )}
        </Card>
      ))}
    </ul>
  );
}

export function ProjectGrid({ projects }: { projects: readonly Project[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const cover = project.images[0];
        return (
          <li key={project.slug}>
            <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-paper-edge bg-white transition-[border-color,box-shadow] duration-300 ease-out focus-within:border-brand-600 hover:border-brand-600 hover:shadow-lg hover:shadow-ink/10 motion-reduce:transition-none">
              <div className="relative aspect-[16/9] overflow-hidden bg-ink">
                {cover && (
                  <Image
                    src={cover.src}
                    alt={cover.alt}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                    className={`object-cover ${mediaZoom}`}
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <p className="text-xs font-semibold uppercase tracking-label text-brand-600">
                  {project.location}
                </p>
                <h3 className="font-display text-lg leading-snug tracking-tight">
                  <Link
                    href={`/projects/${project.slug}/`}
                    className="rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                  >
                    {project.title}
                  </Link>
                </h3>
                <p className="line-clamp-3 flex-1 text-sm text-ink-soft">{project.challenge}</p>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ — details/summary, so it works with no JavaScript                */
/* ------------------------------------------------------------------ */

export function FaqList({ items }: { items: readonly Faq[] }) {
  return (
    <div className="divide-y divide-paper-edge border-y border-paper-edge">
      {items.map((faq) => (
        <details key={faq.question} className="faq-accordion group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
            {faq.question}
            <span
              aria-hidden="true"
              className="shrink-0 text-ink-muted transition-transform duration-300 ease-out group-open:rotate-45 motion-reduce:transition-none"
            >
              +
            </span>
          </summary>
          <p className="mt-3 max-w-prose text-ink-soft">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CTA band                                                             */
/* ------------------------------------------------------------------ */

export function CtaBand({
  heading,
  body,
  cta,
}: {
  heading: string;
  body: string;
  cta: { label: string; href: string };
}) {
  return (
    <Section tone="brand">
      <Container>
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <SectionHeading className="text-white">{heading}</SectionHeading>
            <p className="mt-3 max-w-prose text-white/80">{body}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <ButtonLink href={cta.href} variant="accent">
              {cta.label}
            </ButtonLink>
            <ButtonLink href={site.phone.href} variant="ghostLight">
              {site.phone.display}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Related content                                                      */
/* ------------------------------------------------------------------ */

export function RelatedLinks({
  heading,
  links,
}: {
  heading: string;
  links: readonly { label: string; href: string }[];
}) {
  if (links.length === 0) return null;

  return (
    <div>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-label text-ink-muted">
        {heading}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-block rounded-md border border-paper-edge px-3 py-2 text-sm text-ink-soft hover:bg-paper-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Testimonial                                                          */
/* ------------------------------------------------------------------ */

export function TestimonialBlock({
  quote,
  attribution,
  organisation,
}: {
  quote: string;
  attribution: string;
  organisation?: string;
}) {
  return (
    <figure className="rounded-lg bg-paper-sunken p-6">
      <blockquote className="font-display text-lg leading-relaxed text-ink">“{quote}”</blockquote>
      <figcaption className="mt-4 text-sm text-ink-muted">
        {attribution}
        {organisation && <span> · {organisation}</span>}
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Generic content block                                                */
/* ------------------------------------------------------------------ */

export function ContentBlock({
  eyebrow,
  heading,
  children,
  tone = 'paper',
  id,
  width = 'default',
}: {
  eyebrow?: string;
  heading: string;
  children: ReactNode;
  tone?: 'paper' | 'sunken';
  id?: string;
  /**
   * `wide` for sections carrying a grid of photographs. Prose wants a narrow
   * measure; a photographic grid wants the page. Sharing one width made the
   * images the smaller of the two things it should have favoured.
   */
  width?: 'default' | 'wide';
}) {
  return (
    <Section tone={tone} id={id}>
      <Container width={width}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <SectionHeading className="mb-6">{heading}</SectionHeading>
        {children}
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Media band                                                           */
/* ------------------------------------------------------------------ */

/**
 * One photograph and the claim it evidences, on a full-bleed slab.
 *
 * For the pages that carry long sequencing copy and nothing to break it with.
 * The caption is where the photograph is explained rather than captioned: a
 * process shot only earns its place if it shows the thing the surrounding
 * paragraphs are claiming, and the caption is what ties the two together.
 *
 * Which is why this is a two-part spread and not a picture with a label under
 * it. The caption used to be `text-sm` at 70% white on its own line under a
 * full-width frame, with most of a screen of empty black beside it — typeset
 * as a label, orphaned as a composition, and carrying the page's actual
 * argument while looking like an afterthought. Now the photograph takes seven
 * columns and the claim takes five, the two are locked on a shared bottom
 * line, and the air above the caption is the margin of a spread rather than a
 * hole. The rule over the caption is what makes that read as intentional: it
 * defines the column the text sits at the foot of.
 *
 * Wider than the reading measure on purpose — a band the same width as the
 * text reads as an illustration inside the argument, and this is meant to be a
 * pause in it.
 *
 * `tone` matters more here than anywhere else on the site, because interior
 * trade photography is overwhelmingly high-key: white walls, white partitions,
 * white shirts, and a ceiling full of blown highlights. Put one of those on
 * `paper` or `sunken` and the photograph has no edge — its corners are within
 * a few values of the page behind them and the whole band reads as a pale
 * smear. `ink` is the tone for those, and it does the work no amount of
 * grading would: the surround supplies the contrast the photograph does not
 * have, and the same picture reads as a lit panel.
 *
 * `aspect` defaults to the 3:2 these photographs are shot at, i.e. no crop at
 * all. It was `21/9`, which centre-cropped a 3:2 frame down to its emptiest
 * horizontal band: the ceiling and the drop-sheeted floor went, and what was
 * left was a blank wall with the tradesman pushed against one edge. A crop
 * that discards the evidence defeats the caption above. Anything passed here
 * should be a ratio the photograph was actually composed for.
 *
 * The frame carries an inset hairline. Sitting inside the rounded corner
 * rather than around it, it is the one edge that survives both cases — a pale
 * photograph needs no help against the ink, but the dark quarter of the same
 * picture does.
 */
export function MediaBand({
  src,
  alt,
  caption,
  tone = 'paper',
  aspect = 'aspect-[3/2]',
}: {
  src: string;
  alt: string;
  caption?: string;
  tone?: 'paper' | 'sunken' | 'ink';
  /** Tailwind aspect class for the frame. Match the photograph's own ratio. */
  aspect?: string;
}) {
  const onInk = tone === 'ink';

  return (
    <Section tone={tone}>
      <Container width="wide">
        <figure
          className={cn('group grid gap-8', caption && 'lg:grid-cols-12 lg:items-end lg:gap-10')}
        >
          <div
            className={cn(
              'relative overflow-hidden rounded-lg ring-1 ring-inset',
              aspect,
              caption && 'lg:col-span-7',
              onInk ? 'bg-ink-raised ring-white/[0.12]' : 'bg-paper-sunken ring-ink/10',
            )}
          >
            <Image
              src={src}
              alt={alt}
              fill
              loading="lazy"
              sizes="(min-width: 1024px) 692px, 100vw"
              className={`object-cover ${mediaZoom}`}
            />
          </div>

          {caption && (
            <figcaption className="lg:col-span-5 lg:pb-1">
              {/*
               * A printer's rule, not a divider. The red tab marking its start
               * is the same mark the hero fold puts before its label and the
               * same red the ink slabs rule themselves with — the house accent
               * at the smallest size it is used at, and the only red on this
               * band.
               */}
              <span aria-hidden="true" className="mb-6 flex h-px w-full">
                <span className={cn('h-px w-10', onInk ? 'bg-brand-500' : 'bg-brand-600')} />
                <span className={cn('h-px flex-1', onInk ? 'bg-white/15' : 'bg-paper-edge')} />
              </span>
              {/*
               * `sm:leading-[1.55]` is not redundant with `leading-relaxed`.
               * Tailwind's `text-xl` sets a line-height of its own, and it
               * arrives inside a media query, so at `sm` and up it quietly
               * wins and the serif drops to 1.4 — tight for five lines of it,
               * and a different rhythm from the same paragraph on a phone.
               *
               * `text-pretty` is here for the last line. At this measure the
               * caption breaks with "it." alone on line five, which under a
               * bottom-aligned column is the one rag that reads as a mistake.
               */}
              <p
                className={cn(
                  'text-pretty font-display text-lg leading-relaxed tracking-tight',
                  'sm:text-xl sm:leading-[1.55]',
                  onInk ? 'text-white/85' : 'text-ink',
                )}
              >
                {caption}
              </p>
            </figcaption>
          )}
        </figure>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Process                                                              */
/* ------------------------------------------------------------------ */

/**
 * An ordered run of stages. Shared by the homepage and /commercial/ so the two
 * cannot drift into describing the same process differently.
 *
 * Rendered as an <ol> because the order is the content — these are not
 * interchangeable features. It is drawn as a rail for the same reason: this was
 * a three-column card grid, which put the stages in a zigzag reading order and
 * sat the last one beside a hole, and which made a sequence look exactly like
 * the four unordered card grids surrounding it on the page. A process has a
 * direction; nothing else in these sections does, and now nothing else looks
 * like it.
 *
 * The stages stand on one rule, and a red line runs the length of it on a loop
 * — drawing from Enquiry to Handover, lighting each stage's glyph as it reaches
 * it, then clearing and going again. The loop is the same gesture as the fold
 * seam in the hero. See `.process-rail` in app/globals.css for the timing and
 * for why the rule's resting state is a fully drawn line.
 *
 * It runs on wall-clock time, not on scroll: `InView` pauses it whenever the
 * rail is off screen, so it plays for exactly as long as it is being looked at
 * and costs nothing the rest of the time. Scroll-linking it meant a reader who
 * stopped moving got a half-drawn line, and a reader who flicked past got the
 * whole sequence in three frames — neither of which is the sequence.
 *
 * The rule is horizontal from `lg`, with the numerals and glyphs standing on
 * it; below that it rotates into the left gutter and the stages stack beside
 * it. One relationship, two orientations — a timeline reads the same way turned
 * on its side, and a five-across rail does not survive a phone.
 */
export function ProcessSteps({
  steps,
  stepLabel = 'Stage',
}: {
  steps: readonly { step: string; body: string; icon?: ProcessIconName }[];
  stepLabel?: string;
}) {
  return (
    <InView>
      <ol
        className="process-rail relative lg:flex lg:gap-10"
        // The stage count drives the glyph stagger: each one lights when the
        // line reaches its column, so the offsets have to know how many
        // columns there are rather than assume five.
        style={{ '--rail-count': steps.length } as CSSProperties}
      >
        {/*
         * The rule, and the red line that draws along it. Inset by a few pixels
         * on the vertical run so it starts at the first numeral rather than at
         * the container's corner, and pinned to the numerals' baseline from
         * `lg`.
         */}
        <span
          aria-hidden="true"
          className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-px bg-paper-edge lg:left-0 lg:top-16 lg:h-px lg:w-full"
        />
        <span
          aria-hidden="true"
          className="process-rail__progress absolute left-0 top-1 h-[calc(100%-0.5rem)] w-0.5 bg-brand-500 lg:left-0 lg:top-[3.9375rem] lg:h-0.5 lg:w-full"
        />

        {steps.map((item, index) => (
          <li
            key={item.step}
            className="process-rail__step relative pb-9 pl-7 last:pb-0 lg:flex-1 lg:pb-0 lg:pl-0"
            style={{ '--rail-index': index } as CSSProperties}
          >
            {/*
             * The ordinal and the stage glyph, on one baseline, standing on the
             * rule. The ordinal is at display size and quiet enough that the
             * headings still lead the section — on a rail the numbers are how a
             * reader works out where they are in the run. The glyph is what
             * makes five columns of near-identical text tell themselves apart
             * at a glance, and it is the thing the red line lights on its way
             * past.
             */}
            <span
              aria-hidden="true"
              className="process-rail__marker flex items-end gap-2.5 text-ink-muted lg:h-16"
            >
              <span className="font-display text-4xl leading-none lg:text-5xl">{index + 1}</span>
              <ProcessIcon
                name={item.icon}
                className="process-rail__glyph mb-0.5 h-6 w-6 shrink-0 lg:mb-1.5 lg:h-8 lg:w-8"
              />
            </span>
            <span className="sr-only">
              {stepLabel} {index + 1}
            </span>

            {/* Two lines' worth of room on the rail, so a stage whose name wraps
                ("Written scope and quote") does not push its body a line below
                its neighbours'. Across five columns that misalignment is the
                first thing the eye finds. */}
            <h3 className="mt-3 font-display text-lg tracking-tight lg:mt-6 lg:min-h-[3.5rem]">
              {item.step}
            </h3>
            <p className="mt-2 text-sm text-ink-soft">{item.body}</p>
          </li>
        ))}
      </ol>
    </InView>
  );
}

/* ------------------------------------------------------------------ */
/* Feature grid                                                         */
/* ------------------------------------------------------------------ */

/** Plain heading-and-body cards. No icons — nothing here is decorative. */
export function FeatureGrid({ items }: { items: readonly { heading: string; body: string }[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card as="li" key={item.heading} className="gap-3">
          <h3 className="font-display text-lg tracking-tight">{item.heading}</h3>
          <p className="text-sm leading-relaxed text-ink-soft">{item.body}</p>
        </Card>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Service areas                                                        */
/* ------------------------------------------------------------------ */

/**
 * The suburbs that carry a dedicated, indexed page — currently every Tier 1
 * locality, all of them Victorian, since Queensland has no indexable locality
 * while `qldPresence` is false. `Locality` carries no per-suburb project
 * count the way the old hand-written `Location` records did, so this lists
 * the suburbs themselves rather than a project tally, and links to the areas
 * hub for the full directory rather than shipping a wall of name-swapped
 * links, which is the exact pattern the rebuild is undoing.
 */
export function ServiceAreas({ locations }: { locations: readonly Locality[] }) {
  // One entry per region, carrying the hub URL: the region hubs are the pages
  // meant to rank for region-level queries, and this paragraph used to name
  // them as plain text while linking only /areas/.
  const regions = [
    ...new Map(
      locations.map((l) => [
        l.regionSlug,
        {
          name: getRegion(l.regionSlug)?.name ?? l.regionSlug,
          href: `/areas/${stateSlug(l.state)}/${l.regionSlug}/`,
        },
      ]),
    ).values(),
  ];

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-wrap gap-2">
        {locations.map((location) => (
          <li key={location.href}>
            <Link
              href={location.href}
              className="inline-flex items-baseline gap-2 rounded-md border border-paper-edge bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-ink-muted/40 hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              {displayName(location.name)}
            </Link>
          </li>
        ))}
      </ul>
      <p className="max-w-prose text-sm text-ink-soft">
        Those are the suburbs with a dedicated page. We work right across {regions.length} regions
        of Victoria —{' '}
        {regions.map((region, i) => (
          <Fragment key={region.href}>
            {i > 0 && (i === regions.length - 1 ? ' and ' : ', ')}
            <Link
              href={region.href}
              className="font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              {region.name}
            </Link>
          </Fragment>
        ))}{' '}
        — from our base at {site.address.suburb}, and we service Brisbane, Gold Coast and Sunshine
        Coast in Queensland.{' '}
        <Link
          href="/areas/"
          className="font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          See every area we service
        </Link>
        .
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reviews                                                              */
/* ------------------------------------------------------------------ */

/**
 * Reviews on Google, as their own section.
 *
 * Reproduced with the reviewer's name and the Google attribution intact, and
 * linked back to the profile so any of it can be checked in one click. The
 * aggregate figure is stated as Google's — "5.0 on Google, from 70 reviews" —
 * rather than as the site's own, because it is: the site hosts seven of those
 * seventy and says so.
 *
 * None of this reaches `aggregateRating` markup. See the header of
 * content/reviews.ts for why that line is drawn where it is.
 */
export function GoogleReviewWall() {
  if (googleReviews.length === 0) return null;

  return (
    <Section tone="sunken" id="reviews">
      <Container>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow className="mb-2 text-brand-600">Reviews</Eyebrow>
            <SectionHeading className="mb-3">What clients say on Google</SectionHeading>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-soft">
              <GoogleMark className="h-5 w-5 shrink-0" />
              <span>
                <span className="font-semibold text-ink">
                  {googleAggregate.rating.toFixed(1)} out of 5
                </span>{' '}
                from {googleAggregate.count} Google reviews
              </span>
            </p>
          </div>
          <ButtonLink
            href={googleAggregate.url}
            variant="outline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read them on Google
          </ButtonLink>
        </div>

        <GoogleReviewCarousel reviews={googleReviews} />

        <p className="mt-6 text-xs text-ink-muted">
          Reviews are reproduced from APMG&rsquo;s Google Business Profile as written. The seven
          shown are the commercial ones; the profile carries {googleAggregate.count} in total.
        </p>
      </Container>
    </Section>
  );
}

/**
 * First-party reviews — ones given to APMG directly, with permission.
 *
 * Distinct from the Google wall above, and empty today. These are the only
 * reviews the site aggregates into structured data, so this section and the
 * `aggregateRating` block switch on together the moment one is added.
 */
export function ReviewWall() {
  const shown = firstPartyReviews;
  const average = averageRating();

  if (shown.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {average !== null && (
        <p className={cn(microLabel, 'text-brand-600')}>
          {average} out of 5 · {shown.length} review{shown.length === 1 ? '' : 's'}
        </p>
      )}
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((review) => (
          <Card as="li" key={review.id} className="gap-3">
            <figure className="flex h-full flex-col gap-3">
              <Stars rating={review.rating} />
              <blockquote className="flex-1 text-sm leading-relaxed text-ink-soft">
                &ldquo;{review.quote}&rdquo;
              </blockquote>
              <figcaption className="text-xs text-ink-muted">
                {review.attribution}
                {review.organisation && <span> · {review.organisation}</span>}
                <span className="block">{review.source}</span>
              </figcaption>
            </figure>
          </Card>
        ))}
      </ul>
    </div>
  );
}
