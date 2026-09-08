import { z } from 'zod';
import type { Post, Project, Service } from './types';

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

// Compile-time drift guards. If a type gains a field the schema lacks, or
// vice versa, one of these lines stops compiling.
type Mutable<T> = { -readonly [K in keyof T]: T[K] extends readonly (infer U)[] ? U[] : T[K] };
({}) as z.infer<typeof projectSchema> satisfies Mutable<Project>;
({}) as z.infer<typeof serviceSchema> satisfies Mutable<Service>;
({}) as z.infer<typeof postSchema> satisfies Mutable<Post>;

export const collectionSchemas = {
  projects: projectSchema,
  services: serviceSchema,
  posts: postSchema,
} as const;

export type Collection = keyof typeof collectionSchemas;
export type EntryOf<C extends Collection> = z.infer<(typeof collectionSchemas)[C]>;

export const collections = Object.keys(collectionSchemas) as Collection[];

export function isCollection(value: string): value is Collection {
  return value in collectionSchemas;
}
