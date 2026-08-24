/**
 * Typed content models.
 *
 * These types are the contract between content and presentation. Components
 * never reach into raw data — they receive one of these shapes. That is what
 * makes a later CMS swap an adapter change rather than a rebuild.
 */

/** Marks copy that is awaiting real client input. Never rendered as fact. */
export type EditorialPlaceholder = {
  __placeholder: true;
  note: string;
};

export function placeholder(note: string): EditorialPlaceholder {
  return { __placeholder: true, note };
}

export function isPlaceholder(value: unknown): value is EditorialPlaceholder {
  return typeof value === 'object' && value !== null && '__placeholder' in value;
}

export type Audience = 'residential' | 'commercial';

export type Service = {
  slug: string;
  title: string;
  /** Short label for cards and navigation. */
  shortTitle: string;
  audience: Audience | 'both';
  summary: string;
  body: readonly string[];
  includes: readonly string[];
  /**
   * The card photograph. Work in progress, not a finished room — a service card
   * has to say what the work looks like, and process shots do that. Optional
   * because a service added before its photograph exists must still render.
   */
  image?: { src: string; alt: string };
};

export type Sector = {
  slug: string;
  title: string;
  shortTitle: string;
  /** The page's single search target. One per page. */
  primaryQuery: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  /** What makes this sector operationally different. The reason the page exists. */
  considerations: readonly { heading: string; body: string }[];
  /**
   * What the work involves in this sector, at length.
   *
   * General painting and building knowledge — substrates, preparation,
   * sequencing, coating behaviour. Deliberately NOT a claim about APMG's
   * record in the sector: that is `projectSlugs`, and it is empty for most of
   * these. Depth here is what gives the page a reason to be indexed; the
   * evidence block below it is what stops the depth reading as experience.
   */
  body: readonly string[];
  /** Sector-specific questions. Distinct from the site-wide sets in faqs.ts. */
  faqs: readonly Faq[];
  /** Slugs of projects that evidence this sector. Empty means no proof yet. */
  projectSlugs: readonly string[];
  /** Live-site URL preserved during migration. */
  legacyPath: string;
};

export type ProjectImage = {
  src: string;
  alt: string;
  /** 'before' | 'after' drives the comparison component. */
  phase?: 'before' | 'after';
};

/**
 * Case study model, per the brief. Optional fields are genuinely unknown for
 * some projects — they render as an editorial placeholder rather than being
 * invented.
 */
export type Project = {
  slug: string;
  title: string;
  clientOrPropertyType: string;
  location: string;
  sectorSlug: string;
  initialCondition?: string;
  challenge: string;
  scopeOfWork: readonly string[];
  preparation?: readonly string[];
  coatingSystem?: string;
  accessAndSafety?: readonly string[];
  schedulingConstraints?: readonly string[];
  duration?: string | EditorialPlaceholder;
  images: readonly ProjectImage[];
  outcome: readonly string[];
  testimonial?: Testimonial | EditorialPlaceholder;
  relatedServiceSlugs: readonly string[];
  relatedLocationSlugs: readonly string[];
  /** Content quality gate — thin entries are excluded from featured slots. */
  isFeatured: boolean;
};

export type Testimonial = {
  quote: string;
  attribution: string;
  role?: string;
  organisation?: string;
};

/**
 * Location pages.
 *
 * `indexable` is deliberately data-driven, not a route-level decision. A suburb
 * page is only indexable when it carries genuine unique value — the rules in
 * the brief. Everything else is noindex until evidence exists.
 */
export type Location = {
  slug: string;
  suburb: string;
  region: string;
  /** Projects completed in or near this suburb. The main evidence test. */
  projectSlugs: readonly string[];
  /** Distinct, naturally written copy. Not a name-swapped template. */
  intro?: string;
  localNotes?: readonly string[];
  testimonial?: Testimonial;
  indexable: boolean;
  /** Why this page is or is not indexable. Kept for the client review. */
  indexabilityReason: string;
  legacyPath: string;
};

/**
 * A first-party review.
 *
 * `verified` means the reviewer has agreed to it being reproduced on the site
 * under this attribution. Same rule as accreditations: only verified entries
 * render or reach structured data. A third-party widget's aggregate is not a
 * substitute — see content/reviews.ts.
 */
export type Review = {
  id: string;
  /** 1-5. */
  rating: number;
  quote: string;
  attribution: string;
  organisation?: string;
  /** ISO date the review was given. Required — undated reviews age invisibly. */
  date: string;
  /** Which service the review relates to, for filtering onto the right page. */
  audience: Audience;
  /** Where it originally appeared, e.g. 'Google Business Profile'. */
  source: string;
  verified: boolean;
};

export type Faq = {
  question: string;
  answer: string;
  audience: Audience | 'both';
};
