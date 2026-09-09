import { z } from 'zod';
import type { ContactPageCopy, Post, Project, Service, SiteSettings } from './types';

/**
 * Validation at the CMS boundary. Every row read from Supabase and every
 * form submitted from /admin passes through one of these. They mirror
 * lib/content/types.ts field for field; the `satisfies` checks below make a
 * drift between the two a compile error.
 */

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase letters, digits and single hyphens');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');

export const mediaRefSchema = z.object({
  src: z.string().min(1),
  alt: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  blurDataURL: z.string().optional(),
});

const placeholderSchema = z.object({ __placeholder: z.literal(true), note: z.string() });

const testimonialSchema = z.object({
  quote: z.string().min(1),
  attribution: z.string().min(1),
  role: z.string().optional(),
  organisation: z.string().optional(),
});

export const projectSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  clientOrPropertyType: z.string().min(1),
  location: z.string().min(1),
  sectorSlug: slugSchema,
  initialCondition: z.string().optional(),
  challenge: z.string().min(1),
  scopeOfWork: z.array(z.string().min(1)),
  preparation: z.array(z.string().min(1)).optional(),
  coatingSystem: z.string().optional(),
  accessAndSafety: z.array(z.string().min(1)).optional(),
  schedulingConstraints: z.array(z.string().min(1)).optional(),
  duration: z.union([z.string(), placeholderSchema]).optional(),
  images: z.array(mediaRefSchema.extend({ phase: z.enum(['before', 'after']).optional() })),
  outcome: z.array(z.string().min(1)),
  testimonial: z.union([testimonialSchema, placeholderSchema]).optional(),
  relatedServiceSlugs: z.array(slugSchema),
  relatedLocationSlugs: z.array(slugSchema),
  isFeatured: z.boolean(),
});

export const serviceSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  audience: z.literal('commercial'),
  summary: z.string().min(1),
  body: z.array(z.string().min(1)),
  includes: z.array(z.string().min(1)),
  image: mediaRefSchema.optional(),
});

export const postSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(90),
  excerpt: z.string().min(1).max(300),
  body: z.string().min(1),
  cover: mediaRefSchema.optional(),
  publishedAt: isoDate,
  updatedAt: isoDate.optional(),
  author: z.string().min(1),
  tags: z.array(z.string().min(1)),
  metaTitle: z.string().min(1).max(70),
  metaDescription: z.string().min(1).max(160),
});

/**
 * Business details. Everything an editor is allowed to change about the
 * company's contact facts; the trading and legal names stay in lib/site.ts
 * because "one company name" is a code rule, not editable copy.
 */
const auPhone = z
  .string()
  .trim()
  // 1300/1800 numbers are printed both ways in the wild — APMG's own is
  // grouped in twos ("1300 97 97 40"), but "1300 123 456" is the conventional
  // form and rejecting it would be a validation bug, not a standard.
  .regex(
    /^(\(0\d\)\s?\d{4}\s?\d{4}|0\d(\s?\d{4}){2}|1[38]00(\s?\d{2}){3}|1[38]00(\s?\d{3}){2}|13\s?\d{2}\s?\d{2}|04\d{2}(\s?\d{3}){2})$/,
    'Australian landline, 1300/1800 or mobile number',
  );

const abn = z
  .string()
  .trim()
  .regex(/^\d{2}\s?\d{3}\s?\d{3}\s?\d{3}$/, 'ABN is eleven digits')
  .nullable();

const timeHHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM');

export const siteSettingsSchema = z.object({
  phone: auPhone,
  email: z.string().email(),
  address: z.object({
    street: z.string().min(1),
    suburb: z.string().min(1),
    state: z.enum(['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']),
    postcode: z.string().regex(/^\d{4}$/),
    country: z.literal('AU'),
    effectiveFrom: isoDate.nullable(),
  }),
  previousAddress: z.string().nullable(),
  abn,
  coords: z
    .object({ latitude: z.number().min(-44).max(-10), longitude: z.number().min(112).max(154) })
    .nullable(),
  openingHours: z
    .array(
      z.object({
        days: z
          .array(
            z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
          )
          .min(1),
        opens: timeHHMM,
        closes: timeHHMM,
      }),
    )
    .nullable(),
  serviceAreaPrimary: z.string().min(1),
  social: z.object({
    instagram: z.string().url().nullable(),
    facebook: z.string().url().nullable(),
    google: z.string().url().nullable(),
  }),
});

export const contactPageSchema = z.object({
  slug: z.literal('contact-us'),
  title: z.string().min(1).max(60),
  lede: z.string().min(1).max(300),
  formHeading: z.string().min(1).max(80),
  formIntro: z.string().min(1).max(400),
  metaTitle: z.string().min(1).max(70),
  metaDescription: z.string().min(1).max(160),
});

// Compile-time drift guards. If a type gains a field the schema lacks, or
// vice versa, one of these lines stops compiling.
type Mutable<T> = { -readonly [K in keyof T]: T[K] extends readonly (infer U)[] ? U[] : T[K] };
({}) as z.infer<typeof projectSchema> satisfies Mutable<Project>;
({}) as z.infer<typeof serviceSchema> satisfies Mutable<Service>;
({}) as z.infer<typeof postSchema> satisfies Mutable<Post>;
({}) as z.infer<typeof siteSettingsSchema> satisfies Mutable<SiteSettings>;
({}) as z.infer<typeof contactPageSchema> satisfies Mutable<ContactPageCopy>;

export const collectionSchemas = {
  projects: projectSchema,
  services: serviceSchema,
  posts: postSchema,
  settings: siteSettingsSchema,
  pages: contactPageSchema,
} as const;

export type Collection = keyof typeof collectionSchemas;
export type EntryOf<C extends Collection> = z.infer<(typeof collectionSchemas)[C]>;

export const collections = Object.keys(collectionSchemas) as Collection[];

export function isCollection(value: string): value is Collection {
  return value in collectionSchemas;
}

/**
 * What an editor calls each collection. "settings" and "pages" are storage
 * names; nobody signing in to change the phone number is looking for
 * "settings". Shared by the list page and the entry editor so the two cannot
 * name the same thing differently.
 */
export const collectionTitles: Record<Collection, string> = {
  projects: 'Projects',
  services: 'Services',
  posts: 'Posts',
  settings: 'Business details',
  pages: 'Pages',
};

/** Collections with exactly one entry and a fixed slug. No "New", no delete. */
export const singletonSlug = { settings: 'site', pages: 'contact-us' } as const;

export function isSingleton(collection: Collection): collection is keyof typeof singletonSlug {
  return collection in singletonSlug;
}
