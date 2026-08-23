import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ButtonLink, Card, Container, Eyebrow, SectionHeading, Section } from '@/components/ui';
import { accreditations, site, verifiedAccreditations } from '@/lib/site';
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
  image,
}: {
  eyebrow?: string;
  heading: string;
  lede: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
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
          </div>

          {image && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-paper-edge">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                // Above the fold on every page that uses it.
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </Container>
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
      <Section tone="sunken" className="py-8">
        <Container>
          <p className="rounded-md border border-dashed border-signal-400 bg-signal-400/5 px-4 py-3 text-sm text-ink-soft">
            <span className="font-semibold uppercase tracking-wide text-signal-600">
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

export function ServiceGrid({ services }: { services: readonly Service[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <Card as="li" key={service.slug} className="gap-3">
          <h3 className="font-display text-xl tracking-tight">{service.title}</h3>
          <p className="flex-1 text-sm text-ink-soft">{service.summary}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {service.includes.slice(0, 4).map((item) => (
              <li
                key={item}
                className="rounded bg-paper-sunken px-2 py-1 text-xs font-medium text-ink-soft"
              >
                {item}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </ul>
  );
}

export function SectorGrid({ sectors }: { sectors: readonly Sector[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sectors.map((sector) => (
        <Card as="li" key={sector.slug} className="gap-3">
          <h3 className="font-display text-xl tracking-tight">
            <Link
              href={sector.legacyPath}
              className="rounded after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              {sector.shortTitle}
            </Link>
          </h3>
          <p className="flex-1 text-sm text-ink-soft">{sector.intro}</p>
          {sector.projectSlugs.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
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
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const cover = project.images[0];
        return (
          <li key={project.slug}>
            <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-paper-edge bg-white">
              <div className="relative aspect-[3/2] bg-paper-sunken">
                {cover && (
                  <Image
                    src={cover.src}
                    alt={cover.alt}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
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
            <ButtonLink href={cta.href} variant="signal">
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
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
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
}: {
  eyebrow?: string;
  heading: string;
  children: ReactNode;
  tone?: 'paper' | 'sunken';
  id?: string;
}) {
  return (
    <Section tone={tone} id={id}>
      <Container>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <SectionHeading className="mb-6">{heading}</SectionHeading>
        {children}
      </Container>
    </Section>
  );
}
