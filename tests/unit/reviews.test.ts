import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  averageRating,
  firstPartyReviews,
  googleAggregate,
  googleReviews,
  reviews,
} from '@/content/reviews';
import { localBusinessSchema } from '@/lib/schema';
import { accreditationLogos, accreditations, addressNote, site } from '@/lib/site';

/**
 * The three claims APMG asked for on 24 August 2026 — accreditations, Google
 * reviews, and the Bayswater North address — are the three most load-bearing
 * things on the site, and each of them has a specific way of going wrong:
 *
 *  - a Google review getting into `aggregateRating` markup,
 *  - a house-painting review landing on a commercial-only site,
 *  - a logo referenced from lib/site.ts that is not in `public/`,
 *  - and a "we are moving" notice that outlives the move.
 *
 * These are the tests for those four.
 */

describe('Google reviews stay out of review markup', () => {
  it('has Google reviews to guard', () => {
    expect(googleReviews.length).toBeGreaterThan(0);
    expect(googleReviews.every((review) => !review.firstParty)).toBe(true);
  });

  it('derives no aggregate rating from them', () => {
    // Google's review snippet guidelines want ratings the site collected
    // itself. Marking up reviews read back off a Google profile is the classic
    // route to a structured-data manual action, so `averageRating` is blind to
    // them by construction — not by a filter someone has to remember to apply.
    expect(firstPartyReviews).toHaveLength(0);
    expect(averageRating()).toBeNull();
  });

  it('emits no aggregateRating or review block on the business', () => {
    const schema = localBusinessSchema();

    expect(schema.aggregateRating).toBeUndefined();
    expect(schema.review).toBeUndefined();

    // The strong form: no reviewer's name may appear anywhere in the payload.
    const payload = JSON.stringify(schema);
    for (const review of googleReviews) {
      expect(payload).not.toContain(review.attribution);
    }
  });

  it('states the Google aggregate as Google’s, with somewhere to check it', () => {
    // The visible "5.0 from 70 reviews" is a third-party figure. It is only
    // honest while it is attributed and linked, and only accurate while
    // somebody re-reads it — hence `asOf`.
    expect(googleAggregate.url).toContain('placeid=');
    expect(googleAggregate.count).toBeGreaterThan(googleReviews.length);
    expect(googleAggregate.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('reviews carry what the site needs to publish them', () => {
  it.each(reviews.map((review) => [review.id, review] as const))(
    '%s is attributed, sourced and rated in range',
    (_id, review) => {
      expect(review.attribution.trim()).not.toBe('');
      expect(review.source.trim()).not.toBe('');
      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(5);
      expect(review.quote.length).toBeGreaterThan(40);
    },
  );

  it('carries no house-painting review', () => {
    // This site has no surface for house painting. Three of the ten reviews on
    // the live widget describe exactly that, and they were dropped — a review
    // about a weatherboard home sitting under "commercial painting" reads as
    // padding to a facilities manager and as a mismatch to Google.
    const domestic = /\b(our home|weatherboard|double storey home|house looks)\b/i;
    const leaked = reviews.filter((review) => domestic.test(review.quote));

    expect(leaked.map((review) => review.id)).toEqual([]);
  });

  it('uses unique ids', () => {
    const ids = reviews.map((review) => review.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('accreditations', () => {
  it('publishes only what APMG has confirmed', () => {
    expect(accreditations.length).toBeGreaterThan(0);
    for (const entry of accreditations) {
      // `evidence` is what stops "verified" degrading into "someone ticked a
      // box in 2026". Every published credential has to say how it was
      // established.
      expect(entry.evidence.trim()).not.toBe('');
    }
  });

  it.each(accreditationLogos.map((entry) => [entry.id, entry] as const))(
    '%s has its logo file on disk',
    (_id, entry) => {
      const path = resolve(process.cwd(), 'public', entry.logo!.src.replace(/^\//, ''));
      expect(existsSync(path)).toBe(true);
      expect(entry.logo!.alt.trim()).not.toBe('');
    },
  );

  it('badges no per-person screening check', () => {
    // WWCCs, police checks and NDIS screening are held by people, not by the
    // company. A logo beside them would imply a company-level certification
    // that does not exist, so they are named in words and never badged.
    const personnel = ['wwcc', 'police-check', 'ndis-screening'];
    for (const id of personnel) {
      expect(accreditationLogos.map((entry) => entry.id)).not.toContain(id);
    }
  });
});

describe('the Bayswater North move', () => {
  it('publishes the new address', () => {
    expect(site.address.street).toBe('1 Turbo Drive');
    expect(site.address.suburb).toBe('Bayswater North');
    expect(site.address.postcode).toBe('3153');
  });

  it('qualifies the address until the move date', () => {
    const note = addressNote(new Date('2026-09-01T00:00:00Z'));

    expect(note).toContain('October 2026');
    expect(note).toContain('Chirnside Park');
  });

  it('drops the qualifier once the move date passes', () => {
    // The failure mode this exists for is a "we're moving in October" line
    // still sitting on the contact page in 2028. It expires on its own.
    expect(addressNote(new Date('2026-10-01T00:00:00Z'))).toBeNull();
    expect(addressNote(new Date('2028-01-01T00:00:00Z'))).toBeNull();
  });
});
