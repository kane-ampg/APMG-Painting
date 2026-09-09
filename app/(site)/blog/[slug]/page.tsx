import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/json-ld';
import { PostArticle } from '@/components/pages/post-article';
import { blogPostingSchema } from '@/lib/schema';
import { getPost, getPosts } from '@/lib/content/source';

export async function generateStaticParams() {
  return (await getPosts()).map((post) => ({ slug: post.slug }));
}

export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.metaTitle,
    description: post.metaDescription,
    path: `/blog/${post.slug}/`,
    ogImage: post.cover?.src,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  return (
    <>
      <JsonLd data={blogPostingSchema(post)} />
      <PostArticle post={post} />
    </>
  );
}
