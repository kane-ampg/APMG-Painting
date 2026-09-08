import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CtaBand, ProjectGrid } from '@/components/sections';
import { Container, Placeholder, Prose, Section, SectionHeading } from '@/components/ui';
import { featuredProjects, projects } from '@/content/projects';

export const metadata: Metadata = buildMetadata({
  title: 'Painting Projects & Case Studies | APMG Painting',
  description:
    'Documented commercial painting projects across Melbourne — schools, factories, clinics and offices — including access methods, site constraints and outcomes.',
  path: '/projects/',
});

const thin = projects.filter((project) => !project.isFeatured);

export default function ProjectsPage() {
  return (
    <>
      <Section tone="sunken" className="py-10">
        <Container width="wide">
          <Breadcrumbs crumbs={[{ name: 'Projects', path: '/projects/' }]} />
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Projects</h1>
          <p className="mt-4 max-w-prose text-lg text-ink-soft">
            Completed work, written up properly — what the site was, what constrained the job, how
            access was managed, and what was delivered.
          </p>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <SectionHeading className="mb-6">Documented case studies</SectionHeading>
          <ProjectGrid projects={featuredProjects} />
        </Container>
      </Section>

      {thin.length > 0 && (
        <Section tone="sunken">
          <Container>
            <SectionHeading className="mb-3">Further projects</SectionHeading>
            <Prose className="mb-6">
              <p>
                These are real projects with thin records — the existing pages carry photographs but
                little detail. They are listed rather than hidden, and will be written up properly
                once APMG supplies the project information.
              </p>
            </Prose>
            <div className="mb-6">
              <Placeholder note="scope, preparation, duration and outcome are missing for the projects below. They are excluded from featured slots until that arrives." />
            </div>
            <ProjectGrid projects={thin} />
          </Container>
        </Section>
      )}

      <CtaBand
        heading="Want something similar?"
        body="Tell us about the site and we will tell you how we would approach it."
        cta={{ label: 'Get in touch', href: '/contact-us/' }}
      />
    </>
  );
}
