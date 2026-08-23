import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  AudienceSplit,
  CtaBand,
  ContentBlock,
  Hero,
  ProjectGrid,
  SectorGrid,
  TrustBar,
} from '@/components/sections';
import { ButtonLink, Container, Prose, Section, SectionHeading } from '@/components/ui';
import { featuredProjects } from '@/content/projects';
import { sectors } from '@/content/sectors';
import { site } from '@/lib/site';

/**
 * Homepage.
 *
 * The single most important change on the site: the live homepage is titled
 * "Commercial Painters Melbourne | APMG Painting" — the exact phrase
 * /commercial/ is trying to rank for — and backs it with 3,136 words against
 * that page's 541. This title is brand-led, and the page's job is to split the
 * two audiences and carry proof, not to compete for a service query.
 */
export const metadata: Metadata = buildMetadata({
  title: 'APMG Painting | Commercial & Residential Painters, Melbourne',
  description:
    'APMG Painting is a Melbourne painting contractor working across schools, healthcare, aged care, strata, retail and industrial sites, and on homes across the metro area.',
  path: '/',
});

export default function HomePage() {
  return (
    <>
      <Hero
        eyebrow="Melbourne painting contractor"
        heading="Painters for buildings that cannot stop running"
        lede="APMG Painting works across live sites — schools mid-term, clinics between patients, warehouses mid-shift — and on homes across Melbourne. Founded in 2015 and based in Chirnside Park."
        primaryCta={{ label: 'Commercial painting', href: '/commercial/' }}
        secondaryCta={{ label: 'House painting', href: '/residential-painting/' }}
        image={{
          src: '/images/hero/home-hero.webp',
          alt: 'APMG Painting team applying an exterior coating to a Melbourne building',
        }}
      />

      <TrustBar />

      <AudienceSplit />

      <ContentBlock tone="sunken" eyebrow="Sectors" heading="Where we work most" id="sectors">
        <Prose className="mb-8">
          <p>
            Most of our commercial work sits in buildings where the painting is the easy part and
            the scheduling is not. Each sector below sets out the constraints that actually shape
            the job.
          </p>
        </Prose>
        <SectorGrid sectors={sectors} />
      </ContentBlock>

      <Section tone="paper">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionHeading>Recent projects</SectionHeading>
              <p className="mt-2 text-ink-soft">
                Documented start to finish — access methods, constraints and outcomes.
              </p>
            </div>
            <ButtonLink href="/projects/" variant="outline">
              All projects
            </ButtonLink>
          </div>
          <ProjectGrid projects={featuredProjects} />
        </Container>
      </Section>

      <ContentBlock tone="sunken" heading="About APMG Painting">
        <Prose>
          <p>
            APMG Painting was founded in {site.founded}. The team brings around 30 years of combined
            industry experience, and the business has grown into a painting and property maintenance
            contractor working across both residential properties and complex commercial
            environments.
          </p>
          <p>
            The approach has not changed much: do the work properly, keep the standard consistent,
            and run projects in a way that is organised and easy for clients to work alongside.
            Every project is professionally managed from the first site visit to handover.
          </p>
          <p>
            We use premium-grade paints and materials, including <strong>Dulux</strong> systems,
            selected for the substrate and the conditions rather than for the quote.
          </p>
          <p>
            <Link href="/about-us/" className="font-semibold text-brand-700 hover:underline">
              More about the business
            </Link>
          </p>
        </Prose>
      </ContentBlock>

      <CtaBand
        heading="Tell us what needs painting"
        body="Commercial enquiries get a site assessment before a number. Residential enquiries get a quote after we have seen the property."
        cta={{ label: 'Get in touch', href: '/contact-us/' }}
      />
    </>
  );
}
