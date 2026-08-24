import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
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
import { accreditations, site, verifiedAccreditations } from '@/lib/site';
import { averageRating, verifiedReviews } from '@/content/reviews';
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
                — commercial and residential, Monday to Friday.
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
 * Two layouts out of one set of markup: a photographic band above the copy
 * below `lg`, and the photograph in the right half beside it from `lg` up. Both
 * are driven by the asset — home-hero.webp is 1760x1920, so a half-width column
 * at desktop height matches its aspect almost exactly, and a short wide band is
 * what crops a near-square frame down to the part with the painters in it.
 * Copy over the photograph was the other option and it was worse: a scrim heavy
 * enough to carry white text at 360px wide left nothing of the photograph.
 *
 * On a phone that is both narrow and short — a 360x640 viewport leaves the band
 * about 30px — the band drops out altogether and the copy centres in the space
 * instead. A 30px sliver of photograph reads as a rendering fault; no band
 * reads as a decision.
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
  image,
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
  image: { src: string; alt: string };
  scrollTo: { label: string; href: string };
}) {
  return (
    <section className="hero-viewport relative isolate flex flex-col overflow-hidden bg-ink text-white">
      {/*
       * A band across the top below lg, the right half from lg up. Below lg it
       * takes whatever height the copy and the strip leave it — which is what
       * lets the section hold one viewport exactly on a 640px-tall phone and
       * still give the photograph ~190px on a 390x844 one. A short, wide band
       * also crops the frame vertically, so both painters are in it; the
       * full-bleed version could only ever show the top of the photograph,
       * which is roofline.
       */}
      <div className="relative min-h-20 flex-1 lg:absolute lg:inset-0 lg:left-1/2 lg:min-h-0 lg:flex-none tight:hidden">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          // The largest thing above the fold on the site's most-visited page.
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          // 55% vertically keeps both painters in the band; the desktop half
          // column is within a few percent of the file's own aspect ratio and
          // needs no help.
          className="object-cover object-[50%_55%] lg:object-center"
        />

        {/* Fade the band into the ink panel under it rather than butting it. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink to-transparent lg:hidden"
        />

        {/* Desktop: dissolve the seam down the middle of the section. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 hidden w-32 bg-gradient-to-r from-ink to-transparent lg:block"
        />
      </div>

      <div className="relative z-10 lg:flex lg:flex-1 lg:items-center tight:flex tight:flex-1 tight:items-center">
        <Container width="wide">
          <div className="grid py-10 sm:py-12 lg:grid-cols-2 lg:py-16 short:py-8 tight:py-6">
            <div className="lg:pr-12">
              <p className={cn(microLabel, 'flex items-center gap-3 text-brand-400')}>
                <span aria-hidden="true" className="h-px w-8 bg-brand-500" />
                {eyebrow}
              </p>

              <h1 className="mt-4 text-balance font-display text-[1.95rem] leading-[1.06] tracking-tight sm:text-[2.6rem] lg:text-[3.4rem] short:text-[2.35rem] sm:short:text-[2.6rem] tight:text-[1.7rem]">
                {heading} <span className="text-brand-400">{headingAccent}</span>
              </h1>

              <p className="mt-4 max-w-lg text-base text-white/75 sm:text-lg short:text-base tight:text-sm">
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

              <p className="mt-5 text-sm text-white/70 short:mt-4">
                Or call{' '}
                <a
                  href={site.phone.href}
                  className="rounded font-semibold text-white underline decoration-brand-500 decoration-2 underline-offset-4 hover:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  {site.phone.display}
                </a>{' '}
                — commercial and residential, Monday to Friday.
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* The fold's bottom edge. Translucent so the photograph continues behind
          it rather than being cut off by a solid bar. */}
      <div className="relative z-10 border-t border-white/15 bg-ink/70 backdrop-blur-sm">
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
                  <span className={cn(microLabel, 'text-[0.625rem] text-white/60 sm:text-xs')}>
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
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Audience split — the homepage's main job under a commercial-led plan */
/* ------------------------------------------------------------------ */

export function AudienceSplit() {
  const paths = [
    {
      eyebrow: 'For organisations',
      heading: 'Commercial painting',
      body: 'Schools, clinics, aged care, strata, retail, hospitality and industrial sites. Work programmed around your operating hours, with documented scopes and safety paperwork before we start.',
      cta: { label: 'Commercial painting', href: '/commercial/' },
      secondary: { label: 'Request a site assessment', href: '/contact-us/#commercial' },
    },
    {
      eyebrow: 'For homeowners',
      heading: 'House painting',
      body: 'Interior and exterior work across Melbourne homes. Staged room by room so you keep living in the house, with preparation that decides how long the finish lasts.',
      cta: { label: 'House painting', href: '/residential-painting/' },
      secondary: { label: 'Request a free quote', href: '/contact-us/#residential' },
    },
  ];

  return (
    <Section tone="paper">
      <Container>
        <div className="grid gap-6 md:grid-cols-2">
          {paths.map((path) => (
            <Card key={path.heading} className="gap-4 p-8">
              <Eyebrow>{path.eyebrow}</Eyebrow>
              <h2 className="font-display text-2xl tracking-tight">{path.heading}</h2>
              <p className="flex-1 text-ink-soft">{path.body}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                <ButtonLink href={path.cta.href}>{path.cta.label}</ButtonLink>
                <ButtonLink href={path.secondary.href} variant="outline">
                  {path.secondary.label}
                </ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust indicators                                                     */
/* ------------------------------------------------------------------ */

/**
 * Accreditations.
 *
 * Only entries flagged `verified` in lib/site.ts are presented as credentials.
 * While none are verified, this renders an explicit reviewer note instead of a
 * logo wall — the sandbox must not display an unverified claim as fact.
 */
export function TrustBar() {
  if (verifiedAccreditations.length === 0) {
    return (
      <Section tone="sunken" reveal={false} className="py-8">
        <Container>
          <p className="rounded-md border border-dashed border-signal-400 bg-signal-400/5 px-4 py-3 text-sm text-ink-soft">
            <span className="font-semibold uppercase tracking-label text-signal-600">
              Awaiting content —{' '}
            </span>
            accreditation logos and wording appear here once APMG supplies certificates for{' '}
            {accreditations.map((a) => a.label).join(', ')}. Nothing is displayed as verified until
            then.
          </p>
        </Container>
      </Section>
    );
  }

  return (
    <Section tone="sunken" className="py-10">
      <Container>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {verifiedAccreditations.map((item) => (
            <li key={item.id} className="text-sm font-semibold text-ink-soft">
              {item.label}
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

export function SectorGrid({ sectors }: { sectors: readonly Sector[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sectors.map((sector) => (
        <Card as="li" key={sector.slug} className="gap-3">
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
 * First-party reviews, or an honest note that there are none yet.
 *
 * Same contract as TrustBar: while content/reviews.ts holds no verified
 * entries this renders the gap rather than a Google widget, because a widget's
 * aggregate is not something this site can evidence. Populating reviews.ts
 * turns this section and the LocalBusiness aggregateRating on together.
 */
export function ReviewWall({ audience }: { audience?: 'residential' | 'commercial' }) {
  const shown = audience
    ? verifiedReviews.filter((review) => review.audience === audience)
    : verifiedReviews;
  const average = averageRating();

  if (shown.length === 0) {
    return (
      <Placeholder note="no first-party reviews are published yet. The live site shows a Google widget rating that this site cannot evidence, so nothing is claimed here. Collect reviews through Google Business Profile, then add the ones you have permission to reproduce to content/reviews.ts — this section and the structured data switch on together." />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {average !== null && (
        <p className={cn(microLabel, 'text-brand-600')}>
          {average} out of 5 · {verifiedReviews.length} review
          {verifiedReviews.length === 1 ? '' : 's'}
        </p>
      )}
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((review) => (
          <Card as="li" key={review.id} className="gap-3">
            <p aria-label={`${review.rating} out of 5`} className="text-sm text-brand-600">
              <span aria-hidden="true">{'★'.repeat(review.rating)}</span>
            </p>
            <blockquote className="flex-1 text-sm leading-relaxed text-ink-soft">
              &ldquo;{review.quote}&rdquo;
            </blockquote>
            <footer className="text-xs text-ink-muted">
              {review.attribution}
              {review.organisation && <span> · {review.organisation}</span>}
              <span className="block">{review.source}</span>
            </footer>
          </Card>
        ))}
      </ul>
    </div>
  );
}
