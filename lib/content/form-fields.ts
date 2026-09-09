import { z } from 'zod';
import { collectionSchemas, isSingleton, type Collection } from './schemas';

export type FieldKind = 'text' | 'textarea' | 'lines' | 'boolean' | 'image' | 'json' | 'date';
export type FieldSpec = {
  name: string;
  kind: FieldKind;
  required: boolean;
  /**
   * The schema accepts `null` here. The editor submits `null` rather than `''`
   * for an empty input, because `''` fails `z.string().nullable()` and an
   * editor clearing the ABN field means "we do not publish one", not "publish
   * an empty string".
   */
  nullable: boolean;
};

/** Long-form string fields get a textarea; everything else a single line. */
const TEXTAREA = new Set([
  'summary',
  'challenge',
  'initialCondition',
  'coatingSystem',
  'body',
  'excerpt',
  'metaDescription',
  'lede',
  'formIntro',
]);

type Unwrapped = { inner: z.ZodTypeAny; optional: boolean; nullable: boolean };

/**
 * Strips the wrappers that do not change what the editor shows. Nullable is
 * carried out rather than swallowed: `abn: z.string().nullable()` has to
 * render as a text input, not as a JSON textarea, and the form has to know to
 * send `null` when it is emptied.
 */
function unwrap(schema: z.ZodTypeAny): Unwrapped {
  if (schema instanceof z.ZodOptional) return { ...unwrap(schema.unwrap()), optional: true };
  if (schema instanceof z.ZodDefault) return { ...unwrap(schema._def.innerType), optional: true };
  if (schema instanceof z.ZodNullable) return { ...unwrap(schema.unwrap()), nullable: true };
  return { inner: schema, optional: false, nullable: false };
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
  // A singleton's slug is fixed and set by the save action, so showing it as
  // an editable field invites an edit that is silently discarded.
  const entries = Object.entries(shape).filter(
    ([name]) => !(isSingleton(collection) && name === 'slug'),
  );
  return entries.map(([name, schema]) => {
    const { inner, optional, nullable } = unwrap(schema);
    // A nullable field is not "required" from an editor's point of view: the
    // key must be present, but null is a legitimate value for it.
    return { name, kind: kindOf(name, inner), required: !optional && !nullable, nullable };
  });
}
