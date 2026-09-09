import { notFound } from 'next/navigation';
import { ProjectArticle } from '@/components/pages/project-article';
import { requireAdmin } from '@/lib/auth/admin';
import { isCollection } from '@/lib/content/schemas';
import { getEntryForPreview, getService } from '@/lib/content/source';
import { getSector } from '@/content/sectors';
import type { Project } from '@/lib/content/types';

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
    const relatedServices = (
      await Promise.all(project.relatedServiceSlugs.map((serviceSlug) => getService(serviceSlug)))
    ).filter((service) => service !== undefined);
    return (
      <>
        {banner}
        <ProjectArticle
          project={project}
          sector={getSector(project.sectorSlug)}
          relatedServices={relatedServices}
        />
      </>
    );
  }

  // Task 11 replaces this with PostArticle for the posts collection.
  return (
    <>
      {banner}
      <pre className="mx-auto max-w-3xl overflow-auto p-6 text-xs">
        {JSON.stringify(entry.data, null, 2)}
      </pre>
    </>
  );
}
