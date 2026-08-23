import type { Metadata } from 'next';
import { isSandbox, site, siteUrl } from '@/lib/site';

type BuildMetadataArgs = {
  title: string;
  description: string;
  /** Path with leading and trailing slash, e.g. "/commercial/". */
  path: string;
  /** Set false for pages that must not be indexed (weak location pages). */
  index?: boolean;
  ogImage?: string;
};

/**
 * Single helper for page metadata so every page gets a canonical, an OG block
 * and a correct robots directive by construction.
 *
 * Seven of nine core pages on the live WordPress site ship with no meta
 * description at all. Making `description` a required argument here means that
 * cannot happen again — a page without one will not compile.
 */
export function buildMetadata({
  title,
  description,
  path,
  index = true,
  ogImage = '/images/og/apmg-default.jpg',
}: BuildMetadataArgs): Metadata {
  const url = `${siteUrl}${path}`;

  // The sandbox is never indexable, whatever the page asks for.
  const shouldIndex = index && !isSandbox;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
      googleBot: { index: shouldIndex, follow: shouldIndex },
    },
    openGraph: {
      type: 'website',
      locale: 'en_AU',
      siteName: site.name,
      title,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}
