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

export type Faq = {
  question: string;
  answer: string;
  audience: Audience | 'both';
};
