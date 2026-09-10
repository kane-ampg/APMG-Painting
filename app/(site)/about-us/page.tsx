import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { ContentBlock, CtaBand, Hero } from '@/components/sections';
import { Card, Container, Eyebrow, Prose, Section, SectionHeading } from '@/components/ui';
import { accreditations, brand, directionsUrl, formatAddress, site } from '@/lib/site';
import { getSiteSettings } from '@/lib/content/source';

export const metadata: Metadata = buildMetadata({
  title: 'About APMG Painting | Melbourne Painting Contractor',
  description:
    'APMG Painting is a commercial painting and property maintenance contractor founded in 2015, based in Bayswater North and working across metropolitan Melbourne.',
  path: '/about-us/',
});

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Hero
        eyebrow="About"
        heading="A painting contractor built around how sites actually run"
        lede={`Melbourne-based and Australian-owned. Founded in ${site.founded} and based in ${settings.address.suburb}, APMG Painting works across commercial and industrial projects throughout metropolitan Melbourne.`}
        primaryCta={{ label: 'See our projects', href: '/projects/' }}
        secondaryCta={{ label: 'Get in touch', href: '/contact-us/' }}
        image={{
          src: '/images/hero/about-hero.webp',
          alt: 'APMG Painting crew working on a commercial site in Melbourne',
        }}
      />

      <Container width="wide">
        <Breadcrumbs crumbs={[{ name: 'About', path: '/about-us/' }]} />
      </Container>

      <ContentBlock heading="How the business started">
        <Prose>
          <p>
            {site.legalName} was founded in {site.founded} with two aims: to do painting work
            properly, and to look after the clients who commissioned it. The team brings around 30
            years of combined industry experience to the work.
          </p>
          <p>
            The approach has stayed the same. Do the job properly, hold the standard, and run
            projects in a way that is organised and easy to work alongside. That has produced
            long-term relationships and repeat work across a broad range of clients.
          </p>
          <p>
            Today we run multiple projects across Melbourne at once while keeping the finish and the
            service consistent. Whether it is a single tenancy or a larger commercial or industrial
            programme, the same care and attention goes in.
          </p>
        </Prose>
      </ContentBlock>

      {/* Brand statements from the 2025 brand guide — see `brand` in lib/site.ts
          for what is quoted, what is adapted, and why. */}
      <Section tone="sunken" id="what-we-stand-for">
        <Container>
          <Eyebrow>{brand.descriptor}</Eyebrow>
          <SectionHeading className="mb-6">What we stand for</SectionHeading>
          <Prose className="mb-10">
            <p>
              APMG Painting is the painting business of {brand.groupName}, a {brand.ownership} group
              established in {site.founded}. The group has grown from a painting contractor into a
              property maintenance partner across several trades, and the standard the painting
              crews work to has not moved.
            </p>
          </Prose>

          <div className="mb-10 grid gap-5 lg:grid-cols-2">
            <Card as="div" className="gap-3 border-l-4 border-l-brand-600">
              <h3 className="font-display text-lg">Our vision</h3>
              <p className="text-ink-soft">{brand.vision}</p>
            </Card>
            <Card as="div" className="gap-3 border-l-4 border-l-brand-600">
              <h3 className="font-display text-lg">Our mission</h3>
              <p className="text-ink-soft">{brand.mission}</p>
            </Card>
          </div>

          <h3 className="mb-4 font-display text-xl">Core values</h3>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {brand.values.map((value) => (
              <Card as="li" key={value.name} className="gap-2">
                <h4 className="font-display text-lg">{value.name}</h4>
                <p className="text-sm leading-relaxed text-ink-soft">{value.body}</p>
              </Card>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <SectionHeading className="mb-3">Accreditations and checks</SectionHeading>
          <p className="mb-6 max-w-prose text-ink-soft">
            These are the credentials APMG holds. The screening checks are held per person rather
            than by the company, so they are named here rather than badged — ask and the current
            checks for the crew attending your site will be provided.
          </p>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accreditations.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 rounded-lg border border-paper-edge bg-white p-4"
              >
                <span className="font-semibold text-ink">{item.label}</span>
                <span className="text-sm text-ink-soft">{item.detail}</span>
                {!item.verified && (
                  <span className="mt-1 text-xs font-semibold uppercase tracking-label text-signal-600">
                    Awaiting certificate
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <ContentBlock tone="sunken" heading="Where we are">
        <Prose>
          <p>
            {formatAddress(settings.address)}. We work across metropolitan Melbourne from there —{' '}
            <a
              href={directionsUrl(settings.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-700 hover:underline"
            >
              directions
            </a>
            .
          </p>
          {/* Omitted while unsupplied, like the footer legal line — an
              internal to-do is not visitor copy. */}
          {settings.abn && <p>ABN {settings.abn}.</p>}
        </Prose>
      </ContentBlock>

      <CtaBand
        heading="Work with us"
        body="Every enquiry starts the same way — tell us what needs painting, where it is, and when we are allowed on site."
        cta={{ label: 'Get in touch', href: '/contact-us/' }}
        phone={settings.phone}
      />
    </>
  );
}
