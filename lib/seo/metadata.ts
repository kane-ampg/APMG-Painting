import type { Metadata } from 'next';
import { site, siteUrl } from '@/lib/site';

type BuildMetadataArgs = {
  title: string;
  description: string;
  /** Path with leading and trailing slash, e.g. "/commercial/". */
  path: string;
  /** Set false for pages that must not be indexed (weak location pages). */
  index?: boolean;
  /**
   * Crawl-the-links directive, deliberately independent of `index`.
   *
   * These were one flag until it was noticed that it shipped `nofollow` on
   * every noindex page. The 1,371 Tier 3 suburb pages are noindex *so that*
   * they can still be crawled and pass equity up to the 22 region hubs — that
   * is the entire argument for generating them. `nofollow` turns them into
   * dead ends and deletes the internal-link architecture the plan rests on.
   *
   * Almost nothing should set this. The sandbox lockdown overrides it anyway.
   */
  follow?: boolean;
  /**
   * Overrides the generated card. Leave unset: app/opengraph-image.tsx renders
   * the default one at build time. The previous default pointed at
   * /images/og/apmg-default.jpg, which does not exist, so every shared link
   * produced a broken card.
   */
  ogImage?: string;
  /**
   * Alt text for an ogImage override. Without it the image is described as
   * the site name, which is wrong for every override — a project cover photo
   * is a work photo, not a logo. Required in spirit whenever ogImage is set.
   */
  ogImageAlt?: string;
};

/**
 * Cuts prose down to a meta description.
 *
 * Descriptions generated from longer copy used to be `.slice(0, 155)`, which
 * shipped SERP snippets ending mid-word — Vermont's ended "…stayed open.
 * Vermo". This cuts at the last full sentence that fits; when no full
 * sentence fits, it cuts at a word boundary and marks the cut with an
 * ellipsis so the truncation is deliberate rather than an accident.
 */
export function metaDescription(text: string, limit = 155): string {
  const trimmed = text.trim();
  if (trimmed.length <= limit) return trimmed;

  const window = trimmed.slice(0, limit);
  const sentenceEnd = Math.max(
    window.lastIndexOf('. '),
    window.lastIndexOf('! '),
    window.lastIndexOf('? '),
    /[.!?]$/.test(window) ? window.length - 1 : -1,
  );
  if (sentenceEnd > 0) return window.slice(0, sentenceEnd + 1);

  const wordEnd = window.lastIndexOf(' ');
  // The ellipsis counts toward the limit, so the unbreakable case cuts a
  // character earlier rather than returning limit + 1.
  return `${(wordEnd > 0 ? window.slice(0, wordEnd) : window.slice(0, limit - 1)).trimEnd()}…`;
}

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
  follow = true,
  ogImage,
  ogImageAlt,
}: BuildMetadataArgs): Metadata {
  const url = `${siteUrl}${path}`;

  // The two directives are independent on purpose: an indexable page is
  // `index, follow`, a Tier 3 page is `noindex, follow` — kept out of the
  // index but still crawlable, so its links carry equity up to the region hub.
  const shouldIndex = index;
  const shouldFollow = follow;

  return {
    // `absolute` opts out of the root layout's `%s | APMG Painting`
    // template. Every title below already ends in the brand; letting the
    // template run appended it a second time.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: {
      index: shouldIndex,
      follow: shouldFollow,
      googleBot: { index: shouldIndex, follow: shouldFollow },
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
      // No width/height: overrides are real photographs in whatever aspect
      // they were shot, and a hardcoded 1200×630 was a lie about all of them.
      ...(ogImage ? { images: [{ url: ogImage, alt: ogImageAlt ?? site.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}
