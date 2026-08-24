import type { Review } from '@/lib/content/types';

/**
 * First-party reviews.
 *
 * Empty on purpose, and the emptiness is the point.
 *
 * The live WordPress site displays "5.0, based on 70 reviews" through a Google
 * widget. That number may well be real, but it is not first-party content: the
 * site cannot evidence it, cannot show the reviews it aggregates, and cannot
 * stand behind any individual one. Emitting `aggregateRating` markup from a
 * third-party widget is the classic route to a manual action, so nothing is
 * emitted until reviews live here.
 *
 * To populate this file:
 *
 *  1. Collect reviews through Google Business Profile as normal — that is where
 *     they earn local pack visibility, and it is independent of this file.
 *  2. For each one you want ON the website, get the reviewer's agreement to
 *     reproduce it, with the attribution they are comfortable with.
 *  3. Add it below with `verified: true` and the date it was given.
 *
 * Only entries flagged `verified` render or appear in structured data, exactly
 * as accreditations work in lib/site.ts. A review sitting here with
 * `verified: false` is a draft, not a published claim.
 *
 * The rating scale is 1–5. `aggregateRatingSchema()` in lib/schema derives the
 * average and the count from verified entries only — never type either by hand,
 * because a hand-typed aggregate that disagrees with the reviews beneath it is
 * precisely what structured-data penalties exist for.
 */
export const reviews: readonly Review[] = [] as const;

export const verifiedReviews = reviews.filter((review) => review.verified);

/**
 * Average of verified reviews, or null when there are none.
 *
 * Returns null rather than 0 so a caller cannot accidentally render "0 out of
 * 5" for a business that simply has not published any reviews yet.
 */
export function averageRating(): number | null {
  if (verifiedReviews.length === 0) return null;
  const total = verifiedReviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / verifiedReviews.length) * 10) / 10;
}
