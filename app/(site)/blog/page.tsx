import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CmsImage } from '@/components/media/cms-image';
import { Container, Section, SectionHeading } from '@/components/ui';
import { getPosts } from '@/lib/content/source';

export const metadata: Metadata = buildMetadata({
  title: 'Notes from the job | APMG Painting',
  description:
    'Practical notes on commercial painting in Melbourne: sequencing occupied buildings, coating systems, access and compliance.',
  path: '/blog/',
});

export default async function BlogIndexPage() {
  const posts = await getPosts();
  return (
    <>
      <Section tone="sunken" className="py-10">
        <Container>
          <Breadcrumbs crumbs={[{ name: 'Blog', path: '/blog/' }]} />
          <SectionHeading as="h1">Notes from the job</SectionHeading>
        </Container>
      </Section>
      <Section tone="paper">
        <Container>
          {posts.length === 0 ? (
            <p className="text-ink-soft">Nothing published yet.</p>
          ) : (
            <ul className="grid gap-8 md:grid-cols-2">
              {posts.map((post) => (
                <li key={post.slug} className="flex flex-col gap-3">
                  {post.cover && (
                    <Link
                      href={`/blog/${post.slug}/`}
                      className="relative block aspect-[16/9] overflow-hidden rounded bg-paper-sunken"
                    >
                      <CmsImage
                        image={post.cover}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </Link>
                  )}
                  <h2 className="font-display text-2xl">
                    <Link href={`/blog/${post.slug}/`}>{post.title}</Link>
                  </h2>
                  <p className="text-ink-soft">{post.excerpt}</p>
                  <time
                    dateTime={post.publishedAt}
                    className="text-xs uppercase tracking-label text-ink-soft"
                  >
                    {new Date(post.publishedAt).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
