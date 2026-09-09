import { notFound } from 'next/navigation';
import { PostArticle } from '@/components/pages/post-article';
import { ProjectArticle } from '@/components/pages/project-article';
import { requireAdmin } from '@/lib/auth/admin';
import { isCollection } from '@/lib/content/schemas';
import { getEntryForPreview, getService, getSiteSettings } from '@/lib/content/source';
import { getSector } from '@/content/sectors';
import type { Post, Project } from '@/lib/content/types';

type Props = { params: Promise<{ collection: string; slug: string }> };

export default async function PreviewPage({ params }: Props) {
  await requireAdmin();
  const { collection, slug } = await params;
  if (!isCollection(collection)) notFound();
  const entry = await getEntryForPreview(collection, slug);
  if (!entry) notFound();

  const banner = (
    <p className="bg-yellow-100 px-4 py-2 text-center text-sm">
      Preview — {entry.status}. Not what the public sees until published.
    </p>
  );

  // The generic getEntryForPreview() return type does not correlate with
  // `collection` for TypeScript, so the cast below is what narrows it — safe
  // because collection is checked first.
  if (collection === 'projects') {
    const project = entry.data as Project;
    const [relatedServices, settings] = await Promise.all([
      Promise.all(project.relatedServiceSlugs.map((serviceSlug) => getService(serviceSlug))).then(
        (all) => all.filter((service) => service !== undefined),
      ),
      getSiteSettings(),
    ]);
    return (
      <>
        {banner}
        <ProjectArticle
          project={project}
          sector={getSector(project.sectorSlug)}
          relatedServices={relatedServices}
          settings={settings}
        />
      </>
    );
  }

  if (collection === 'posts') {
    return (
      <>
        {banner}
        <PostArticle post={entry.data as Post} />
      </>
    );
  }

  return (
    <>
      {banner}
      <pre className="mx-auto max-w-3xl overflow-auto p-6 text-xs">
        {JSON.stringify(entry.data, null, 2)}
      </pre>
    </>
  );
}
