import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CtaBand, ProjectGrid, TestimonialBlock } from '@/components/sections';
import { Container, Placeholder, Prose, Section, SectionHeading } from '@/components/ui';
import { getLocation, locations } from '@/content/locations';
import { getProject } from '@/content/projects';
import { site } from '@/lib/site';

export function generateStaticParams() {
  return locations.map((location) => ({ slug: location.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocation(slug);
  if (!location) return {};

  return buildMetadata({
    title: `Painters ${location.suburb} | APMG Painting`,
    description: location.intro
      ? location.intro.slice(0, 155)
      : `APMG Painting services ${location.suburb} and the surrounding ${location.region.toLowerCase()} area from our Chirnside Park base.`,
    path: `/areas/${location.slug}/`,
    // Data-driven: weak pages are noindex until they earn otherwise.
    index: location.indexable,
  });
}

export default async function LocationPage({ params }: Props) {
  const { slug } = await params;
  const location = getLocation(slug);
  if (!location) notFound();

  const projects = location.projectSlugs
    .map((projectSlug) => getProject(projectSlug))
    .filter((project) => project !== undefined);

  return (
    <>
      <Section tone="sunken" className="py-10">
        <Container width="wide">
          <Breadcrumbs
            crumbs={[
              { name: 'Areas we service', path: '/areas/' },
              { name: location.suburb, path: `/areas/${location.slug}/` },
            ]}
          />
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
            {location.region}
          </p>
          {/* One H1, and it names the suburb correctly. The live pages render
              "Painters Painters Armadale" and "Painting Brighton". */}
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            Painters in {location.suburb}
          </h1>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          {!location.indexable && (
            <div className="mb-8">
              <Placeholder note={`this page is set to noindex. ${location.indexabilityReason}`} />
            </div>
          )}

          <Prose>
            {location.intro ? (
              <p>{location.intro}</p>
            ) : (
              <p>
                APMG Painting services {location.suburb} and the surrounding{' '}
                {location.region.toLowerCase()} area from our base at {site.address.suburb}.
              </p>
            )}
            {location.localNotes?.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </Prose>
        </Container>
      </Section>

      {projects.length > 0 && (
        <Section tone="sunken">
          <Container>
            <SectionHeading className="mb-6">Work completed nearby</SectionHeading>
            <ProjectGrid projects={projects} />
          </Container>
        </Section>
      )}

      {location.testimonial && (
        <Section tone="paper">
          <Container width="narrow">
            <TestimonialBlock
              quote={location.testimonial.quote}
              attribution={location.testimonial.attribution}
              organisation={location.testimonial.organisation}
            />
          </Container>
        </Section>
      )}

      <CtaBand
        heading={`Painting in ${location.suburb}?`}
        body="Tell us what needs doing and we will come and look."
        cta={{ label: 'Get in touch', href: '/contact-us/' }}
      />
    </>
  );
}
