import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import {
  ContentBlock,
  CtaBand,
  FaqList,
  Hero,
  ProcessSteps,
  ProjectGrid,
  SectorGrid,
  TrustBar,
} from '@/components/sections';
import { Container, Prose, Section, SectionHeading } from '@/components/ui';
import { JsonLd } from '@/components/seo/json-ld';
import { faqSchema, serviceSchema } from '@/lib/schema';
import { sectors } from '@/content/sectors';
import { featuredProjects } from '@/content/projects';
import { faqsFor } from '@/content/faqs';

/**
 * Commercial hub — now the page that owns "commercial painters Melbourne".
 *
 * The live version is 541 words with no case study, no sector detail, no
 * process and no accreditation. It also carries the site's only national claim
 * ("hundreds of ... all throughout Australia"), which is not repeated here:
 * every project APMG can evidence is Victorian.
 */
export const metadata: Metadata = buildMetadata({
  title: 'Commercial Painters Melbourne | APMG Painting',
  description:
    'Commercial painting contractors in Melbourne. Schools, healthcare, aged care, strata, retail, hospitality and industrial sites — programmed around your operating hours.',
  path: '/commercial/',
});

const PROCESS = [
  {
    step: 'Site assessment',
    body: 'We attend site before quoting. Scope, substrate condition, access constraints and the hours we are allowed to work all get established there rather than assumed.',
  },
  {
    step: 'Documented scope and quotation',
    body: 'An itemised quotation broken down by area, system and schedule — written so a committee, a board or a procurement lead can approve it without a second round of questions.',
  },
  {
    step: 'Pre-start and paperwork',
    body: 'Safe Work Method Statements, insurance certificates and site-specific compliance documentation prepared in advance, with a pre-start meeting to confirm expectations.',
  },
  {
    step: 'Staged delivery',
    body: 'Work sequenced zone by zone or after hours so the building keeps operating. Access planned per elevation — ladders, scaffolding, scissor lift or EWP as each area requires.',
  },
  {
    step: 'Handover',
    body: 'Areas cleaned down and handed back progressively rather than all at the end, so the site regains use of each space as it is finished.',
  },
];

export default function CommercialPage() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: 'Commercial painting',
          description:
            'Commercial painting contracting across Melbourne, including education, healthcare, aged care, strata, retail, hospitality and industrial sites.',
          path: '/commercial/',
        })}
      />
      {/* The page already carried the FAQ content; it emitted no FAQPage, so
          neither rich results nor AI answer engines could extract it. */}
      <JsonLd data={faqSchema(faqsFor('commercial'))} />

      <Hero
        eyebrow="Commercial painting"
        heading="Commercial painters in Melbourne"
        lede="Painting commercial buildings is mostly a coordination problem. The coating matters, but what decides whether a project works is how well it is staged around the people still using the building."
        primaryCta={{ label: 'Request a site assessment', href: '/contact-us/#commercial' }}
        secondaryCta={{ label: 'See our projects', href: '/projects/' }}
        image={{
          src: '/images/work/ewp-tilt-panel-cutting-in.webp',
          alt: 'An APMG painter working from a boom lift, harnessed, cutting the line between white and green tilt panels on a warehouse elevation',
        }}
      />

      <Container width="wide">
        <Breadcrumbs crumbs={[{ name: 'Commercial painting', path: '/commercial/' }]} />
      </Container>

      <TrustBar />

      <ContentBlock heading="What commercial work actually involves">
        <Prose>
          <p>
            We deliver interior and exterior painting for commercial and industrial sites across
            Melbourne — from tenancy repaints and office fit-outs through to large-format building
            exteriors. Projects range from a two-person, two-day job through to programmes requiring
            boom lifts, scissor lifts, scaffolding and roof rigging.
          </p>
          <p>
            The harder projects need surface knowledge more than they need labour. Older buildings
            need existing coatings identified and the substrate properly assessed before anything is
            specified. Preparation is matched to what we find — hot or cold power washing, steam
            cleaning, sandblasting, abrasion or chemical treatment where required.
          </p>
          <p>
            Most of the sites we work on stay open throughout. That is the constraint that shapes
            everything else: how zones are isolated, when work happens, and how each area is handed
            back.
          </p>
        </Prose>
      </ContentBlock>

      <Section tone="sunken">
        <Container>
          <SectionHeading className="mb-3">How a commercial project runs</SectionHeading>
          <p className="mb-8 max-w-prose text-ink-soft">
            Five stages, in order. The documentation exists before anyone picks up a brush.
          </p>
          <ProcessSteps steps={PROCESS} />
        </Container>
      </Section>

      <ContentBlock heading="Sectors we work in">
        <Prose className="mb-8">
          <p>
            Each sector below has its own operating constraints. The pages set out what those are
            rather than repeating the same paint copy with a different heading.
          </p>
        </Prose>
        <SectorGrid sectors={sectors} />
      </ContentBlock>

      <Section tone="sunken">
        <Container>
          <SectionHeading className="mb-3">Commercial case studies</SectionHeading>
          <p className="mb-8 max-w-prose text-ink-soft">
            Documented projects, including the access methods used and the constraints worked
            around.
          </p>
          <ProjectGrid projects={featuredProjects} />
        </Container>
      </Section>

      <ContentBlock heading="Commercial painting questions">
        <FaqList items={faqsFor('commercial')} />
      </ContentBlock>

      <CtaBand
        heading="Request a site assessment"
        body="Tell us the sector, the location and the hours we are allowed on site. We will come and look before quoting."
        cta={{ label: 'Start a commercial enquiry', href: '/contact-us/#commercial' }}
      />
    </>
  );
}
