import type { Metadata } from 'next';
import { isSandbox, site, siteUrl } from '@/lib/site';

type BuildMetadataArgs = {
  title: string;
  description: string;
  /** Path with leading and trailing slash, e.g. "/commercial/". */
  path: string;
  /** Set false for pages that must not be indexed (weak location pages). */
  index?: boolean;
  /**
   * Overrides the generated card. Leave unset: app/opengraph-image.tsx renders
   * the default one at build time. The previous default pointed at
   * /images/og/apmg-default.jpg, which does not exist, so every shared link
   * produced a broken card.
   */
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
  ogImage,
}: BuildMetadataArgs): Metadata {
  const url = `${siteUrl}${path}`;

  // The sandbox is never indexable, whatever the page asks for.
  const shouldIndex = index && !isSandbox;

  return {
    // `absolute` opts out of the root layout's `%s | APMG Painting`
    // template. Every title below already ends in the brand; letting the
    // template run appended it a second time.
    title: { absolute: title },
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
      // Omitted deliberately when unset, so Next's opengraph-image file
      // convention supplies the generated card instead of being overridden.
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: site.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}
