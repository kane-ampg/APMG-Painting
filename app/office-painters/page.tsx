import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { ContentBlock, CtaBand, Hero, ProjectGrid, TrustBar } from '@/components/sections';
import { Container, Prose, Section, SectionHeading } from '@/components/ui';
import { JsonLd } from '@/components/seo/json-ld';
import { serviceSchema } from '@/lib/schema';
import { getService } from '@/content/services';
import { getProject } from '@/content/projects';

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
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
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

      <CtaBand
        heading="Repainting your workplace?"
        body="Tell us the floor area and the hours we are allowed in, and we will come and look."
        cta={{ label: 'Request a site assessment', href: '/contact-us/#commercial' }}
      />
    </>
  );
}
