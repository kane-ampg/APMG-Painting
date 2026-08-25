import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { SectorIcon } from '@/components/icons/sector-icons';
import { HeroReel } from '@/components/media/hero-reel';
import {
  ButtonLink,
  Card,
  Container,
  Eyebrow,
  mediaZoom,
  microLabel,
  Placeholder,
  SectionHeading,
  Section,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { accreditationLogos, accreditations, site } from '@/lib/site';
import {
  averageRating,
  firstPartyReviews,
  googleAggregate,
  googleReviews,
} from '@/content/reviews';
import type { Faq, Location, Project, Sector, Service } from '@/lib/content/types';

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
/* Trust indicators                                                     */
/* ------------------------------------------------------------------ */

/**
 * Accreditations, as a logo wall.
 *
 * Only entries flagged `verified` in lib/site.ts are presented as credentials,
 * and only the four that carry a mark get a logo — the screening checks are
 * held per person, so badging them would imply a company-level certification
 * that does not exist. They are stated in words on the about page instead.
 *
 * Each mark sits on its own white chip. The four supplied files do not agree
 * on a background — MPA is transparent, the Dulux badge has white baked in and
 * Haymes a solid blue box — so dropping them straight onto the sunken band
 * showed the boxes. A chip normalises that, and heights are capped rather than
 * widths so the portrait MPA mark and the landscape Dulux one read at the same
 * optical weight.
 *
 * In colour, not greyscale: a faded accreditation badge reads as decoration,
 * and these are the strongest trust signal on the page.
 *
 * If nothing is verified the bar renders the gap rather than disappearing:
 * a silently empty trust bar looks identical to a business with no credentials.
 */
export function TrustBar() {
  if (accreditationLogos.length === 0) {
    return (
      <Section tone="sunken" reveal={false} className="py-8">
        <Container>
          <Placeholder
            note={`accreditation logos and wording appear here once APMG supplies certificates for ${accreditations
              .map((a) => a.label)
              .join(', ')}. Nothing is displayed as verified until then.`}
          />
        </Container>
      </Section>
    );
  }

  return (
    <Section tone="sunken" reveal={false} className="py-8 sm:py-10">
      <Container>
        <h2 className={cn(microLabel, 'mb-6 text-center text-ink-muted')}>
          Accredited, prequalified and insured
        </h2>
        <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
          {accreditationLogos.map((item) => (
            <li
              key={item.id}
              className="flex h-20 w-36 items-center justify-center rounded-lg border border-paper-edge bg-white px-4 py-3 sm:w-40"
            >
              <Image
                src={item.logo!.src}
                alt={item.logo!.alt}
                width={item.logo!.width}
                height={item.logo!.height}
                className="max-h-full w-auto object-contain"
              />
              <span className="sr-only">{item.detail}</span>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
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
 * Cards are not links. Services do not each have a page, so the frame carries
 * the house photo zoom and nothing else that would imply somewhere to click;
 * `image` stays optional so a service without a photograph still renders as
 * the plain card it used to be.
 */
export function ServiceGrid({ services }: { services: readonly Service[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <li key={service.slug}>
          <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-paper-edge bg-white">
            {service.image && (
              <div className="relative aspect-[16/9] overflow-hidden bg-ink">
                <Image
                  src={service.image.src}
                  alt={service.image.alt}
                  fill
                  loading="lazy"
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  className={`object-cover ${mediaZoom}`}
                />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-3 p-5">
              <h3 className="font-display text-lg tracking-tight">{service.title}</h3>
              <p className="flex-1 text-sm text-ink-soft">{service.summary}</p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {service.includes.slice(0, 4).map((item) => (
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
      ))}
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
        <details key={faq.question} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
            {faq.question}
            <span
              aria-hidden="true"
              className="shrink-0 text-ink-muted transition-transform group-open:rotate-45 motion-reduce:transition-none"
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
 * One wide photograph between two blocks of prose.
 *
 * For the pages that carry long sequencing copy and nothing to break it with.
 * The caption is where the photograph is explained rather than captioned: a
 * process shot only earns its place if it shows the thing the surrounding
 * paragraphs are claiming, and the caption is what ties the two together.
 *
 * Wider than the reading measure on purpose — a band the same width as the
 * text reads as an illustration inside the argument, and this is meant to be a
 * pause in it.
 */
export function MediaBand({
  src,
  alt,
  caption,
  tone = 'paper',
}: {
  src: string;
  alt: string;
  caption?: string;
  tone?: 'paper' | 'sunken';
}) {
  return (
    <Section tone={tone} className="py-10 sm:py-12">
      <Container width="wide">
        <figure className="group">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-paper-sunken sm:aspect-[21/9]">
            <Image
              src={src}
              alt={alt}
              fill
              loading="lazy"
              sizes="(min-width: 1280px) 1216px, 100vw"
              className={`object-cover ${mediaZoom}`}
            />
          </div>
          {caption && (
            <figcaption className="mt-3 max-w-prose text-sm text-ink-soft">{caption}</figcaption>
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
 * interchangeable features.
 */
export function ProcessSteps({
  steps,
  stepLabel = 'Stage',
}: {
  steps: readonly { step: string; body: string }[];
  stepLabel?: string;
}) {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {steps.map((item, index) => (
        <Card as="li" key={item.step} className="gap-2">
          <span className="text-xs font-semibold uppercase tracking-label text-brand-600">
            {stepLabel} {index + 1}
          </span>
          <h3 className="font-display text-lg tracking-tight">{item.step}</h3>
          <p className="text-sm text-ink-soft">{item.body}</p>
        </Card>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Figures                                                              */
/* ------------------------------------------------------------------ */

/**
 * A black band of plain figures.
 *
 * Every value passed in must be derived from lib/site.ts or the content files,
 * never typed as a literal in the page — that is what stops a "500+ projects"
 * style claim appearing here later. Each figure carries a label precise enough
 * to be defensible on its own.
 */
export function FactStrip({
  facts,
}: {
  facts: readonly { figure: string; label: string; detail: string }[];
}) {
  return (
    <Section tone="ink" className="border-t-4 border-brand-600 py-12 sm:py-14">
      <Container width="wide">
        <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs font-semibold uppercase tracking-label text-white/60">
                {fact.label}
              </dt>
              <dd className="mt-2">
                <span className="font-display text-3xl font-semibold leading-none tracking-tight text-brand-400">
                  {fact.figure}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-white/70">
                  {fact.detail}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
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
 * Suburbs grouped by region, showing only where a project is actually
 * documented. Suburbs with no evidence are counted, not listed — the homepage
 * links to the areas hub for the full directory rather than shipping a wall of
 * name-swapped links, which is the exact pattern the rebuild is undoing.
 */
export function ServiceAreas({ locations }: { locations: readonly Location[] }) {
  const evidenced = locations.filter((l) => l.projectSlugs.length > 0);
  const regions = [...new Set(locations.map((l) => l.region))];

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-wrap gap-2">
        {evidenced.map((location) => (
          <li key={location.slug}>
            <Link
              href={`/areas/${location.slug}/`}
              className="inline-flex items-baseline gap-2 rounded-md border border-paper-edge bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-ink-muted/40 hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              {location.suburb}
              <span className="text-xs font-medium text-brand-600">
                {location.projectSlugs.length} project
                {location.projectSlugs.length === 1 ? '' : 's'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="max-w-prose text-sm text-ink-soft">
        Those are the suburbs with a documented job behind them. We work right across{' '}
        {regions.length} regions of metropolitan Melbourne — {regions.slice(0, -1).join(', ')} and{' '}
        {regions[regions.length - 1]} — from our base at {site.address.suburb}.{' '}
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
 * The Google "G", inline.
 *
 * Inline rather than an asset because it is four flat paths, it has to sit
 * beside text at whatever size the line box is, and a reviews section that
 * shows a broken image where the attribution should be is worse than one with
 * no mark at all.
 */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={className}>
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

/** Five stars, `rating` of them filled. Announced once, as text, to a reader. */
function Stars({ rating }: { rating: number }) {
  return (
    <p className="text-sm tracking-[0.15em] text-brand-600">
      <span className="sr-only">{rating} out of 5</span>
      <span aria-hidden="true">
        {'★'.repeat(rating)}
        <span className="text-paper-edge">{'★'.repeat(5 - rating)}</span>
      </span>
    </p>
  );
}

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

        {/* Columns, not a grid. Reviews run from two lines to twelve, and a
            grid stretches every card in a row to the tallest one — which left
            half the wall as whitespace. Columns let each card be its own
            height and pack the next one underneath. */}
        <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {googleReviews.map((review) => (
            <Card as="li" key={review.id} className="mb-5 h-auto break-inside-avoid gap-3">
              {/* figure/blockquote/figcaption is the house pattern for an
                  attributed quotation — see TestimonialBlock. A <footer> here
                  would scope to the section, not the card, and put seven of
                  them on the page. */}
              <figure className="flex flex-col gap-3">
                <Stars rating={review.rating} />
                <blockquote className="flex-1 text-sm leading-relaxed text-ink-soft">
                  &ldquo;{review.quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-2 border-t border-paper-edge pt-3 text-xs text-ink-muted">
                  <GoogleMark className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    <span className="font-semibold text-ink">{review.attribution}</span>
                    {review.organisation && <span> · {review.organisation}</span>}
                    <span className="block">on {review.source}</span>
                  </span>
                </figcaption>
              </figure>
            </Card>
          ))}
        </ul>

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
