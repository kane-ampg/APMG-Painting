import type { Review } from '@/lib/content/types';

/**
 * Reviews.
 *
 * Two different things live in this file, and keeping them apart is the whole
 * point of it.
 *
 * **Google reviews** (`firstParty: false`). Ten are published through the
 * review widget on apmgpainting.com.au; the seven below are the ones that are
 * commercial or sector-neutral. Three were dropped because they describe house
 * painting — "our home was transformed inside and out", "our double storey
 * home", "our double storey weatherboard house" — and this site has no
 * house-painting surface to put them on. They render with the Google
 * attribution intact and a link back to the profile, and they are excluded from
 * `aggregateRating` markup. That exclusion is deliberate: Google's review
 * snippet guidelines want ratings collected by the site itself, and marking up
 * reviews scraped back off Google is a well-worn route to a manual action.
 *
 * **First-party reviews** (`firstParty: true`). None yet. These are reviews
 * given to APMG directly, with the reviewer's agreement to reproduce them.
 * Only these reach `aggregateRating`, and adding the first one switches the
 * structured data on by itself.
 *
 * Quotes are reproduced as written, including the odd typo. The one edit made
 * is that where the widget's markup ran two sentences together at a line break
 * ("painted.Our store"), the space has been restored. `date` is null on all of
 * them because the widget does not expose review dates — they are readable on
 * the Google Business Profile and worth backfilling, since an undated review
 * ages invisibly.
 */

/**
 * The Google Business Profile aggregate, as the profile itself reports it.
 *
 * Displayed as an attributed third-party figure — "5.0 on Google, from 70
 * reviews" — and never emitted as `aggregateRating`, for the reason above.
 * Re-read it off the profile when it drifts; nothing derives it.
 */
export const googleAggregate = {
  rating: 5.0,
  count: 70,
  /** Where the number was read, and where a visitor can check it. */
  url: 'https://search.google.com/local/reviews?placeid=ChIJnV9lqRIw1moRftY3Ankvfdw',
  /** Date the figure above was last read off the profile. */
  asOf: '2026-08-24',
} as const;

export const reviews: readonly Review[] = [
  {
    id: 'google-andrea-lowe',
    rating: 5,
    quote:
      'APMG did an outstanding job painting our school during the school holidays. Their professionalism and efficiency ensured minimal disruption to our teaching and learning. The results are impressive, revitalizing our school. They were considerate and respectful to everyone, and we highly recommend APMG for any painting projects. We are thrilled with their work!',
    attribution: 'Andrea Lowe',
    date: null,
    audience: 'commercial',
    source: 'Google Business Profile',
    firstParty: false,
    verified: true,
  },
  {
    id: 'google-andrew-nicholson',
    rating: 5,
    quote:
      'Craig and the team were very professional and a pleasure to deal with. They preformed the interior painting of an operating hotel, with high quality workmanship and a very reasonable price. I will definitely be using their services again and would have no hesitation in recommending APMG.',
    attribution: 'Andrew Nicholson',
    date: null,
    audience: 'commercial',
    source: 'Google Business Profile',
    firstParty: false,
    verified: true,
  },
  {
    id: 'google-helena-p',
    rating: 5,
    quote:
      'APMG Painting did a fantastic job painting our building in Cheltenham. The company is very easy to deal with and the works are fantastic at what they do, they always came on time never left early, kept everything clean and everyone was very friendly. They gave us a good quote and did a great job! Strongly recommend!',
    attribution: 'Helena P.',
    date: null,
    audience: 'commercial',
    source: 'Google Business Profile',
    firstParty: false,
    verified: true,
  },
  {
    id: 'google-jordan',
    rating: 5,
    quote:
      'I have been working with Reece for a number of weeks, maybe months, to begin works on having our building painted. Our store had seen better days and Reece and his team worked around many of my setbacks with the utmost professionalism. Reece was receptive and quick to communicate via phone or email. The team got the job done quickly and even went back in to do some final touch ups a day or two after. I can’t thank Reece and the team enough. We appreciate you bringing our building and our store back to life!',
    attribution: 'Jordan',
    date: null,
    audience: 'commercial',
    source: 'Google Business Profile',
    firstParty: false,
    verified: true,
  },
  {
    id: 'google-christopher-hayward',
    rating: 5,
    quote:
      'Couldn’t be happier with the service! Communication was excellent from the start, prompt, professional, and easy to deal with. The quality of the work was outstanding could not recommend enough. These guys made the whole process easy and stress free',
    attribution: 'Christopher Hayward',
    date: null,
    audience: 'commercial',
    source: 'Google Business Profile',
    firstParty: false,
    verified: true,
  },
  {
    id: 'google-christopher-loh',
    rating: 5,
    quote:
      'A delightful experience dealing with Farbod and his team. Nothing was too difficult. They gave good professional advice. Job was completed in a timely manner. Variations were not a problem. Quotes were quick. Very happy to recommend APMG and I will definitely be using them again in the future.',
    attribution: 'Christopher Loh',
    date: null,
    audience: 'commercial',
    source: 'Google Business Profile',
    firstParty: false,
    verified: true,
  },
  {
    id: 'google-peter-other',
    rating: 5,
    quote:
      'Great workmanship with excellent communication and planning. Everything that was requested was delivered with high quality and no questions asked. The team was hard working and very friendly. Highly recommended.',
    attribution: 'Peter Other',
    date: null,
    audience: 'commercial',
    source: 'Google Business Profile',
    firstParty: false,
    verified: true,
  },
] as const;

export const verifiedReviews = reviews.filter((review) => review.verified);

/** Google reviews, reproduced with attribution. Never marked up as ratings. */
export const googleReviews = verifiedReviews.filter((review) => !review.firstParty);

/**
 * Reviews given to APMG directly, with permission to reproduce.
 *
 * The only reviews `aggregateRating` may be derived from. Empty today.
 */
export const firstPartyReviews = verifiedReviews.filter((review) => review.firstParty);

/**
 * Average of first-party reviews, or null when there are none.
 *
 * Returns null rather than 0 so a caller cannot accidentally render "0 out of
 * 5" for a business that simply has not published any first-party reviews yet.
 *
 * Deliberately blind to the Google reviews above. If this counted them, the
 * site would emit an aggregate over reviews it does not host — the exact thing
 * the split in this file exists to prevent.
 */
export function averageRating(): number | null {
  if (firstPartyReviews.length === 0) return null;
  const total = firstPartyReviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / firstPartyReviews.length) * 10) / 10;
}
