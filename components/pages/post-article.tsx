import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CmsImage } from '@/components/media/cms-image';
import { Container, Section } from '@/components/ui';
import type { Post } from '@/lib/content/types';

/**
 * Markdown is rendered without raw HTML (react-markdown's default), so an
 * editor cannot paste a script tag into a post. GFM gives tables and lists.
 */
export function PostArticle({ post }: { post: Post }) {
  const published = new Date(post.publishedAt).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <article>
      <Section tone="sunken" className="py-10">
        <Container>
          <p className="mb-3 text-xs font-semibold uppercase tracking-label text-brand-600">
            <time dateTime={post.publishedAt}>{published}</time>
          </p>
          <h1 className="max-w-4xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 max-w-prose text-lg text-ink-soft">{post.excerpt}</p>
        </Container>
      </Section>
      {post.cover && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-paper-sunken sm:aspect-[21/9]">
          <CmsImage image={post.cover} fill priority sizes="100vw" className="object-cover" />
        </div>
      )}
      <Section tone="paper">
        <Container>
          <div className="prose prose-lg max-w-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
          </div>
        </Container>
      </Section>
    </article>
  );
}
