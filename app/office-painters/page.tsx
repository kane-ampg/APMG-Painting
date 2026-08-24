import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import {
  ContentBlock,
  CtaBand,
  FaqList,
  FeatureGrid,
  Hero,
  ProjectGrid,
  TrustBar,
} from '@/components/sections';
import { Container, Prose, Section, SectionHeading } from '@/components/ui';
import { JsonLd } from '@/components/seo/json-ld';
import { faqSchema, serviceSchema } from '@/lib/schema';
import { getService } from '@/content/services';
import { getProject } from '@/content/projects';
import { officeFaqs } from '@/content/faqs';

/**
 * Office painting.
 *
 * URL preserved. The live page is titled "Office Painting - APMG Painting" with
 * no "Melbourne" — weak for its own target query — so the title changes while
 * the URL does not. The duplicated office section has been removed from
 * /commercial/, which now links here instead.
 */
export const metadata: Metadata = buildMetadata({
  title: 'Office Painting Melbourne | Office Painters | APMG Painting',
  description:
    'Office painters in Melbourne. Workplace repaints programmed after hours or in staged zones so your team keeps working through the job.',
  path: '/office-painters/',
});

const service = getService('office-painting');
const ndis = getProject('ndis-commercial-painting');

/**
 * Trade content for the office page — general workplace-repaint knowledge, not
 * a claim about APMG. The page was 305 words and had no chance of ranking for
 * its own target query on depth alone.
 */
const AROUND = [
  'An office repaint is scoped by how much of the floor can be released at once, not by floor area. A single open floor handed over for a weekend moves fast. The same area released as four zones across four weekends is the same amount of painting spread over four times the elapsed period, with four sets of set-up and pack-down inside it. Both are legitimate; they cost differently, and the difference should be visible before the choice is made.',
  'The equipment is rarely the problem — the personal effects are. Monitors, docks and cabling are straightforward to cover or move, but desks carrying papers, mugs, plants and framed photographs cannot be cleared by a painting crew without someone eventually asking where something went. A floor where staff have cleared their own desks before the programme starts runs measurably faster than one where they have not.',
  'Comms rooms, floor boxes and data cabling are treated as exclusion zones unless the IT team says otherwise. So are anything sprinkler-related and any device on a ceiling. Marking those out at the site assessment is quicker than discovering them at eleven at night with masking already up.',
  'Low-VOC systems are standard for occupied workplaces, but ventilation is what actually clears a floor before staff return. That ventilation window is a real constraint on the programme, and it is one of the main reasons larger floors are done across a weekend rather than overnight.',
];

const OFFICE_SURFACES = [
  {
    heading: 'Walls in circulation routes',
    body: 'Corridors, lift lobbies and the walls beside desks take chair, bag and trolley contact. A washable system in those runs and a standard finish elsewhere gets more life from the same budget than specifying the whole floor up.',
  },
  {
    heading: 'Ceiling grid and exposed services',
    body: 'Grid, ductwork and conduit spray well. Acoustic tiles are a judgement call, because coating them can reduce their acoustic performance — on a floor where that matters, replacing tiles and coating the grid is usually the better answer.',
  },
  {
    heading: 'Doors, frames and joinery',
    body: 'These are the surfaces people actually touch, and they are what a visiting client notices. They take a harder-wearing system and more preparation time per square metre than any wall on the floor.',
  },
  {
    heading: 'Kitchens, bathrooms and end-of-trip',
    body: 'Wet and high-traffic amenities are specified for moisture and frequent commercial cleaning, not as an extension of the office wall system.',
  },
  {
    heading: 'Patching and making good',
    body: 'Removed signage, old fixings, previous partition lines and cable penetrations all have to be made good before coating, and on a floor that has had several tenancies this is often the largest preparation item.',
  },
  {
    heading: 'Make-good at lease end',
    body: 'A make-good scope is written against the lease, not against taste. Establishing exactly what the lease requires before quoting prevents both over-scoping and a failed handover inspection.',
  },
];

export default function OfficePaintersPage() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: 'Office painting',
          description:
            'Office and workplace painting across Melbourne, delivered after hours or in staged zones.',
          path: '/office-painters/',
        })}
      />
      <JsonLd data={faqSchema(officeFaqs)} />

      <Hero
        eyebrow="Commercial painting"
        heading="Office painters in Melbourne"
        lede="Office work is judged on disruption as much as finish. Most programmes run after hours or in staged zones, so desks stay occupied and the business keeps operating."
        primaryCta={{ label: 'Request a site assessment', href: '/contact-us/#commercial' }}
        secondaryCta={{ label: 'All commercial work', href: '/commercial/' }}
      />

      <Container width="wide">
        <Breadcrumbs
          crumbs={[
            { name: 'Commercial painting', path: '/commercial/' },
            { name: 'Office painting', path: '/office-painters/' },
          ]}
        />
      </Container>

      <TrustBar />

      <ContentBlock heading="What we paint in an office">
        <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
          <Prose>
            {service?.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <p>
              A well-kept workspace is the first thing a visiting client reads about a business.
              Internally it does something quieter but more useful — a clean, well-presented floor
              is easier to work in.
            </p>
            <p>
              Colour selection is part of the service. We will sit down and work through options
              rather than sending a chart.
            </p>
          </Prose>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-label text-ink-muted">
              Includes
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-ink-soft">
              {service?.includes.map((item) => (
                <li key={item} className="border-b border-paper-edge pb-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ContentBlock>

      {ndis && (
        <Section tone="sunken">
          <Container>
            <SectionHeading className="mb-3">Office work at scale</SectionHeading>
            <p className="mb-8 max-w-prose text-ink-soft">
              Eleven occupied office sites for a single client, under one programme.
            </p>
            <ProjectGrid projects={[ndis]} />
          </Container>
        </Section>
      )}

      <ContentBlock tone="sunken" heading="What an office repaint has to work around">
        <Prose>
          {AROUND.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </Prose>
      </ContentBlock>

      <ContentBlock heading="The surfaces in an office fit-out">
        <Prose className="mb-8">
          <p>
            An office is not one surface repeated. These take different systems and different
            amounts of preparation time, and a quote that treats them as one number is hiding
            something.
          </p>
        </Prose>
        <FeatureGrid items={OFFICE_SURFACES} />
      </ContentBlock>

      <ContentBlock tone="sunken" heading="Office painting questions">
        <FaqList items={officeFaqs} />
      </ContentBlock>

      <CtaBand
        heading="Repainting your workplace?"
        body="Tell us the floor area and the hours we are allowed in, and we will come and look."
        cta={{ label: 'Request a site assessment', href: '/contact-us/#commercial' }}
      />
    </>
  );
}
