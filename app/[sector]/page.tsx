import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import {
  ContentBlock,
  CtaBand,
  FaqList,
  Hero,
  ProjectGrid,
  RelatedLinks,
  TrustBar,
} from '@/components/sections';
import { Card, Container, Placeholder, Prose, Section, SectionHeading } from '@/components/ui';
import { JsonLd } from '@/components/seo/json-ld';
import { faqSchema, serviceSchema } from '@/lib/schema';
import { sectors } from '@/content/sectors';
import { getProject } from '@/content/projects';

/**
 * Sector pages.
 *
 * These live at the root because that is where they already live on the live
 * site (/healthcare-painters/, /retail-painting/ and so on). A dynamic segment
 * at the root preserves all seven existing URLs exactly — static routes such as
 * /about-us/ and /commercial/ still take precedence, and anything unmatched
 * falls through to notFound(), which is a real 404.
 */

const bySlug = new Map(sectors.map((s) => [s.legacyPath.replace(/\//g, ''), s]));

export function generateStaticParams() {
  return sectors.map((sector) => ({ sector: sector.legacyPath.replace(/\//g, '') }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ sector: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sector: slug } = await params;
  const sector = bySlug.get(slug);
  if (!sector) return {};

  return buildMetadata({
    title: sector.metaTitle,
    description: sector.metaDescription,
    path: sector.legacyPath,
  });
}

export default async function SectorPage({ params }: Props) {
  const { sector: slug } = await params;
  const sector = bySlug.get(slug);
  if (!sector) notFound();

  const projects = sector.projectSlugs
    .map((projectSlug) => getProject(projectSlug))
    .filter((project) => project !== undefined);

  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: sector.title,
          description: sector.metaDescription,
          path: sector.legacyPath,
        })}
      />
      <JsonLd data={faqSchema(sector.faqs)} />

      <Container width="wide">
        <Breadcrumbs
          crumbs={[
            { name: 'Commercial painting', path: '/commercial/' },
            { name: sector.shortTitle, path: sector.legacyPath },
          ]}
        />
      </Container>

      <Hero
        eyebrow="Commercial painting"
        heading={sector.title}
        lede={sector.intro}
        primaryCta={{ label: 'Request a site assessment', href: '/contact-us/#commercial' }}
        secondaryCta={{ label: 'All commercial work', href: '/commercial/' }}
      />

      <TrustBar />

      <Section tone="paper">
        <Container>
          <SectionHeading className="mb-3">What shapes work in this sector</SectionHeading>
          <p className="mb-8 max-w-prose text-ink-soft">
            The operational constraints that decide how the programme is built.
          </p>
          <ul className="grid gap-4 md:grid-cols-2">
            {sector.considerations.map((item) => (
              <Card as="li" key={item.heading} className="gap-2">
                <h3 className="font-display text-lg tracking-tight">{item.heading}</h3>
                <p className="text-sm text-ink-soft">{item.body}</p>
              </Card>
            ))}
          </ul>
        </Container>
      </Section>

      <ContentBlock tone="sunken" heading="What the work involves">
        <Prose>
          {sector.body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </Prose>
      </ContentBlock>

      <Section tone="paper">
        <Container>
          <SectionHeading className="mb-6">Evidence</SectionHeading>
          {projects.length > 0 ? (
            <ProjectGrid projects={projects} />
          ) : (
            <Placeholder
              note={`no completed ${sector.shortTitle.toLowerCase()} project is documented yet. This page makes no sector experience claim until APMG supplies one. Until then it should stay noindex or be folded into /commercial/.`}
            />
          )}
        </Container>
      </Section>

      <ContentBlock tone="sunken" heading={`${sector.shortTitle} painting questions`}>
        <FaqList items={sector.faqs} />
      </ContentBlock>

      <ContentBlock heading="Related">
        <Prose className="mb-6">
          <p>
            Commercial work rarely sits in one sector. These are the closest neighbours to{' '}
            {sector.shortTitle.toLowerCase()}.
          </p>
        </Prose>
        <RelatedLinks
          heading="Other sectors"
          links={sectors
            .filter((other) => other.slug !== sector.slug)
            .slice(0, 6)
            .map((other) => ({ label: other.shortTitle, href: other.legacyPath }))}
        />
      </ContentBlock>

      <CtaBand
        heading={`Talk to us about ${sector.shortTitle.toLowerCase()} work`}
        body="Tell us the site, the constraints and when we are allowed on it."
        cta={{ label: 'Request a site assessment', href: '/contact-us/#commercial' }}
      />
    </>
  );
}
