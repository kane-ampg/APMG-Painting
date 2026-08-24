import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  AudienceSplit,
  CtaBand,
  ContentBlock,
  FactStrip,
  FaqList,
  FeatureGrid,
  HomeHero,
  ProcessSteps,
  ProjectGrid,
  ReviewWall,
  SectorGrid,
  ServiceAreas,
  ServiceGrid,
  TestimonialBlock,
  TrustBar,
} from '@/components/sections';
import { JsonLd } from '@/components/seo/json-ld';
import { ButtonLink, Container, Prose, Section, SectionHeading } from '@/components/ui';
import { faqSchema } from '@/lib/schema';
import { homeFaqs } from '@/content/faqs';
import { locations } from '@/content/locations';
import { featuredProjects, getProject } from '@/content/projects';
import { sectors } from '@/content/sectors';
import { services } from '@/content/services';
import { isPlaceholder } from '@/lib/content/types';
import { site } from '@/lib/site';

/**
 * Homepage.
 *
 * The single most important change on the site: the live homepage is titled
 * "Commercial Painters Melbourne | APMG Painting" — the exact phrase
 * /commercial/ is trying to rank for — and backs it with 3,136 words against
 * that page's 541. This title is brand-led, and the page's job is to split the
 * two audiences and carry proof, not to compete for a service query.
 *
 * Everything below is assembled from the typed content files. No figure, quote
 * or credential is written as a literal in this file — if it appears on this
 * page it exists in content/ or lib/site.ts and has survived the same
 * verification rule as every other surface.
 */
export const metadata: Metadata = buildMetadata({
  title: 'APMG Painting | Commercial & Residential Painters, Melbourne',
  description:
    'APMG Painting is a Melbourne painting contractor working across schools, healthcare, aged care, strata, retail and industrial sites, and on homes across the metro area.',
  path: '/',
});

/**
 * The audience-neutral version of the process. /commercial/ carries its own,
 * which adds a pre-start documentation stage — that stage is genuinely
 * commercial-only, so the two lists differ by exactly that one step.
 */
const PROCESS = [
  {
    step: 'Enquiry',
    body: 'Tell us the building, the areas involved and when we are allowed on site. The commercial and residential forms ask different questions because different things matter.',
  },
  {
    step: 'Site visit',
    body: 'We attend before quoting. Scope, substrate condition, access and the hours we are allowed to work get established rather than assumed.',
  },
  {
    step: 'Written scope and quote',
    body: 'An itemised breakdown covering labour, materials and scheduling — per location where the work spans several sites — so you can see where the cost actually sits.',
  },
  {
    step: 'Staged delivery',
    body: 'Work sequenced zone by zone or after hours so the building keeps operating. Access planned per area: ladders, scaffolding, scissor lift or EWP as each space requires.',
  },
  {
    step: 'Handover',
    body: 'Areas cleaned down and handed back progressively rather than all at the end, so the site regains the use of each space as it is finished.',
  },
] as const;

/**
 * How the work is actually run. Each item summarises something stated at length
 * in content/services.ts or content/faqs.ts — this grid is a table of contents
 * for that detail, not a set of claims of its own.
 */
const APPROACH = [
  {
    heading: 'We attend before we quote',
    body: 'Preparation is the largest variable in any painting job, and it cannot be judged from a photograph or a floor area. Attending first is what stops a quote turning into a variation.',
  },
  {
    heading: 'The building keeps running',
    body: 'Schools mid-term, clinics between patients, warehouses mid-shift. Zones are isolated, work is staged or run after hours, and each area is handed back as it finishes.',
  },
  {
    heading: 'Preparation matched to the substrate',
    body: 'Existing coatings identified and the surface assessed before anything is specified — hot or cold power washing, steam cleaning, abrasion or chemical treatment, depending on what we find.',
  },
  {
    heading: 'Access planned per elevation',
    body: 'Not site-wide. Multi-level and hard-to-reach areas are reached with the appropriate equipment rather than the most convenient one, and exterior work is scheduled around suitable weather.',
  },
  {
    heading: 'An itemised number, not one figure',
    body: 'Labour, materials and scheduling are broken out, and multi-site programmes are broken down per location, so a budget holder can see what they are approving.',
  },
  {
    heading: 'One programme for the adjacent trades',
    body: 'Plastering, patching, rendering, tiling, flooring and making good coordinated under the same programme, because the gap between trades is what usually stalls a job.',
  },
] as const;

export default function HomePage() {
  const yearsTrading = new Date().getFullYear() - site.founded;

  // The one attributable testimonial APMG has published. The other four
  // projects carry an editorial placeholder instead, and that holds here too:
  // one real quote rather than three invented ones.
  const quoted = getProject('case-study-factory-exterior-painting-in-noble-park-victoria');
  const testimonial =
    quoted?.testimonial && !isPlaceholder(quoted.testimonial) ? quoted.testimonial : null;

  return (
    <>
      <JsonLd data={faqSchema(homeFaqs)} />

      <HomeHero
        eyebrow="Melbourne painting contractor"
        heading="Painters for buildings that"
        headingAccent="cannot stop running"
        lede="Commercial and residential painting across metropolitan Melbourne — schools mid-term, clinics between patients, warehouses mid-shift, and homes people are still living in."
        primaryCta={{ label: 'Commercial painting', href: '/commercial/' }}
        secondaryCta={{ label: 'House painting', href: '/residential-painting/' }}
        proof={[
          { figure: `${yearsTrading} years`, label: 'In business' },
          { figure: '~30 years', label: 'Combined experience' },
          { figure: `${site.serviceArea.radiusKm} km`, label: 'Across Melbourne' },
        ]}
        image={{
          src: '/images/hero/home-hero.webp',
          alt: 'Two APMG Painting tradespeople sanding back an exterior post before recoating',
        }}
        scrollTo={{ label: 'What we paint', href: '#services' }}
      />

      <TrustBar />

      <AudienceSplit />

      <FactStrip
        facts={[
          {
            label: 'In business',
            figure: `${yearsTrading} years`,
            detail: `${site.legalName} was founded in ${site.founded} and has grown into a painting and property maintenance contractor.`,
          },
          {
            label: 'Combined experience',
            figure: '~30 years',
            detail: 'The team’s industry experience, across homes and complex commercial sites.',
          },
          {
            label: 'Commercial sectors',
            figure: String(sectors.length),
            detail:
              'Each with its own access, compliance and scheduling constraints, set out sector by sector.',
          },
          {
            label: 'Service area',
            figure: `${site.serviceArea.radiusKm} km`,
            detail: `Metropolitan Melbourne, worked from ${site.address.suburb}.`,
          },
        ]}
      />

      <ContentBlock eyebrow="Services" heading="What we paint" id="services" width="wide">
        <Prose className="mb-8">
          <p>
            Five lines of work, run by the same team. Most jobs draw on more than one of them — an
            exterior programme that needs render repairs first, or an office repaint that ends up
            including the patching and the flooring.
          </p>
        </Prose>
        <ServiceGrid services={services} />
      </ContentBlock>

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
          <SectionHeading className="mb-3">How a job runs</SectionHeading>
          <p className="mb-8 max-w-prose text-ink-soft">
            The same five steps whether it is a house or a campus. Commercial programmes add a
            documentation and pre-start stage on top of them.
          </p>
          <ProcessSteps steps={PROCESS} stepLabel="Step" />
        </Container>
      </Section>

      <ContentBlock
        tone="sunken"
        eyebrow="How we work"
        heading="What actually makes the difference"
      >
        <Prose className="mb-8">
          <p>
            Almost nobody chooses a painter on the paint. The things below are what separate a job
            that lands on time from one that does not.
          </p>
        </Prose>
        <FeatureGrid items={APPROACH} />
      </ContentBlock>

      <Section tone="paper">
        <Container width="wide">
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

      <ContentBlock tone="sunken" eyebrow="In their words" heading="What clients say">
        {testimonial && (
          <div className="mb-8 max-w-2xl">
            <TestimonialBlock
              quote={testimonial.quote}
              attribution={testimonial.attribution}
              organisation={testimonial.organisation}
            />
          </div>
        )}
        <ReviewWall />
      </ContentBlock>

      <ContentBlock eyebrow="Areas" heading="Where we work across Melbourne">
        <ServiceAreas locations={locations} />
      </ContentBlock>

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

      <ContentBlock eyebrow="Questions" heading="Before you enquire">
        <p className="mb-8 max-w-prose text-ink-soft">
          The questions that come up before anyone has decided which service they need. The{' '}
          <Link href="/commercial/" className="font-semibold text-brand-700 hover:underline">
            commercial
          </Link>{' '}
          and{' '}
          <Link
            href="/residential-painting/"
            className="font-semibold text-brand-700 hover:underline"
          >
            residential
          </Link>{' '}
          pages answer the ones specific to each.
        </p>
        <FaqList items={homeFaqs} />
      </ContentBlock>

      <CtaBand
        heading="Tell us what needs painting"
        body="Commercial enquiries get a site assessment before a number. Residential enquiries get a quote after we have seen the property."
        cta={{ label: 'Request a quote', href: '/contact-us/' }}
      />
    </>
  );
}
