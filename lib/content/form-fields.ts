import { z } from 'zod';
import { collectionSchemas, type Collection } from './schemas';

export type FieldKind = 'text' | 'textarea' | 'lines' | 'boolean' | 'image' | 'json' | 'date';
export type FieldSpec = { name: string; kind: FieldKind; required: boolean };

/** Long-form string fields get a textarea; everything else a single line. */
const TEXTAREA = new Set([
  'summary',
  'challenge',
  'initialCondition',
  'coatingSystem',
  'body',
  'excerpt',
  'metaDescription',
]);

function unwrap(schema: z.ZodTypeAny): { inner: z.ZodTypeAny; optional: boolean } {
  if (schema instanceof z.ZodOptional)
    return { inner: unwrap(schema.unwrap()).inner, optional: true };
  if (schema instanceof z.ZodDefault)
    return { inner: unwrap(schema._def.innerType).inner, optional: true };
  return { inner: schema, optional: false };
}

function kindOf(name: string, schema: z.ZodTypeAny): FieldKind {
  if (schema instanceof z.ZodBoolean) return 'boolean';
  if (schema instanceof z.ZodString) {
    // `_def.checks` and each check's `{ kind, regex }` shape are Zod 3
    // internals, not part of its public API. This must be revisited (Zod 4
    // restructures string validations into a different internal format) if
    // this project ever upgrades off Zod 3.
    const hasDateRegex = schema._def.checks.some(
      (c) => c.kind === 'regex' && c.regex.source.startsWith('^\\d{4}-\\d{2}-\\d{2}$'),
    );
    if (hasDateRegex) return 'date';
    return TEXTAREA.has(name) ? 'textarea' : 'text';
  }
  if (schema instanceof z.ZodLiteral) return 'text';
  if (schema instanceof z.ZodArray && schema.element instanceof z.ZodString) return 'lines';
  if (
    schema instanceof z.ZodObject &&
    'src' in schema.shape &&
    'alt' in schema.shape &&
    !('quote' in schema.shape)
  ) {
    return 'image';
  }
  return 'json';
}

/**
 * Turns a collection's Zod object into editor fields. Kept deliberately
 * shallow: anything nested that is not an image becomes a validated JSON
 * textarea (spec §6). The schema, not this file, decides what is valid.
 */
export function fieldsFor(collection: Collection): FieldSpec[] {
  const shape = collectionSchemas[collection].shape as Record<string, z.ZodTypeAny>;
  return Object.entries(shape).map(([name, schema]) => {
    const { inner, optional } = unwrap(schema);
    return { name, kind: kindOf(name, inner), required: !optional };
  });
}
