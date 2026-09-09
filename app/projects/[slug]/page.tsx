import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { ProjectArticle } from '@/components/pages/project-article';
import { getProject, getProjects, getService, getSiteSettings } from '@/lib/content/source';
import { getSector } from '@/content/sectors';

export async function generateStaticParams() {
  return (await getProjects()).map((project) => ({ slug: project.slug }));
}

// A project published from the CMS after the last build renders on first
// request, then is cached like the rest.
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};

  return buildMetadata({
    title: project.title,
    description: project.challenge.slice(0, 155),
    path: `/projects/${project.slug}/`,
    ogImage: project.images[0]?.src,
  });
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const sector = getSector(project.sectorSlug);
  const [relatedServices, settings] = await Promise.all([
    Promise.all(project.relatedServiceSlugs.map((serviceSlug) => getService(serviceSlug))).then(
      (all) => all.filter((service) => service !== undefined),
    ),
    getSiteSettings(),
  ]);

  return (
    <ProjectArticle
      project={project}
      sector={sector}
      relatedServices={relatedServices}
      settings={settings}
    />
  );
}
