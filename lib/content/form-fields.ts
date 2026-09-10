import { z } from 'zod';
import { collectionSchemas, isSingleton, type Collection } from './schemas';

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'lines'
  | 'boolean'
  | 'image'
  | 'gallery'
  | 'testimonial'
  | 'group'
  | 'group-list'
  | 'select'
  | 'number'
  | 'date';

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
  /** The schema's own `.max()`, so the editor can show a character count. */
  maxLength?: number;
  /** Allowed values for a `select`. */
  options?: string[];
  /** Sub-fields of a `group`, or of one row of a `group-list`. */
  children?: FieldSpec[];
  /**
   * The schema also accepts an editorial placeholder here (`duration`,
   * `testimonial`). The editor shows the placeholder's note and keeps it
   * unless the field is filled in, rather than silently discarding copy
   * somebody wrote on purpose.
   */
  allowsPlaceholder?: boolean;
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
 * render as a text input, and the form has to know to send `null` when it is
 * emptied.
 */
function unwrap(schema: z.ZodTypeAny): Unwrapped {
  if (schema instanceof z.ZodOptional) return { ...unwrap(schema.unwrap()), optional: true };
  if (schema instanceof z.ZodDefault) return { ...unwrap(schema._def.innerType), optional: true };
  if (schema instanceof z.ZodNullable) return { ...unwrap(schema.unwrap()), nullable: true };
  return { inner: schema, optional: false, nullable: false };
}

function isPlaceholderSchema(schema: z.ZodTypeAny): boolean {
  return schema instanceof z.ZodObject && '__placeholder' in schema.shape;
}

/**
 * `_def.checks` and each check's `{ kind, regex, value }` shape are Zod 3
 * internals, not part of its public API. This must be revisited (Zod 4
 * restructures string validations into a different internal format) if this
 * project ever upgrades off Zod 3.
 */
function stringChecks(schema: z.ZodString): { isDate: boolean; max?: number } {
  const isDate = schema._def.checks.some(
    (c) => c.kind === 'regex' && c.regex.source.startsWith('^\\d{4}-\\d{2}-\\d{2}$'),
  );
  const maxCheck = schema._def.checks.find((c) => c.kind === 'max');
  return { isDate, max: maxCheck && 'value' in maxCheck ? maxCheck.value : undefined };
}

function isMediaObject(schema: z.ZodTypeAny): schema is z.ZodObject<z.ZodRawShape> {
  return schema instanceof z.ZodObject && 'src' in schema.shape && 'alt' in schema.shape;
}

function isTestimonialObject(schema: z.ZodTypeAny): boolean {
  return schema instanceof z.ZodObject && 'quote' in schema.shape;
}

type Derived = Pick<FieldSpec, 'kind' | 'maxLength' | 'options' | 'children' | 'allowsPlaceholder'>;

function describe(name: string, schema: z.ZodTypeAny): Derived {
  if (schema instanceof z.ZodBoolean) return { kind: 'boolean' };
  if (schema instanceof z.ZodNumber) return { kind: 'number' };
  if (schema instanceof z.ZodString) {
    const { isDate, max } = stringChecks(schema);
    if (isDate) return { kind: 'date' };
    return { kind: TEXTAREA.has(name) ? 'textarea' : 'text', maxLength: max };
  }
  if (schema instanceof z.ZodLiteral) return { kind: 'text' };
  if (schema instanceof z.ZodEnum) return { kind: 'select', options: [...schema.options] };
  if (schema instanceof z.ZodArray) {
    const element = unwrap(schema.element as z.ZodTypeAny).inner;
    if (element instanceof z.ZodString || element instanceof z.ZodEnum) return { kind: 'lines' };
    if (isMediaObject(element)) return { kind: 'gallery' };
    if (element instanceof z.ZodObject) {
      return { kind: 'group-list', children: shapeToFields(element.shape as z.ZodRawShape) };
    }
    return { kind: 'lines' };
  }
  if (schema instanceof z.ZodObject) {
    if (isTestimonialObject(schema)) {
      return { kind: 'testimonial', children: shapeToFields(schema.shape as z.ZodRawShape) };
    }
    if (isMediaObject(schema)) return { kind: 'image' };
    return { kind: 'group', children: shapeToFields(schema.shape as z.ZodRawShape) };
  }
  if (schema instanceof z.ZodUnion) {
    const options = (schema.options as z.ZodTypeAny[]).filter((o) => !isPlaceholderSchema(o));
    const allowsPlaceholder = options.length !== (schema.options as z.ZodTypeAny[]).length;
    const first = options[0];
    if (first) return { ...describe(name, unwrap(first).inner), allowsPlaceholder };
  }
  // Nothing left in any current schema reaches here. A new nested shape gets
  // a plain text input rather than a JSON textarea; the editor never shows
  // raw data, so an unhandled shape is a bug to fix in this file.
  return { kind: 'text' };
}

function shapeToFields(shape: z.ZodRawShape): FieldSpec[] {
  return Object.entries(shape).map(([name, schema]) => toField(name, schema as z.ZodTypeAny));
}

function toField(name: string, schema: z.ZodTypeAny): FieldSpec {
  const { inner, optional, nullable } = unwrap(schema);
  // A nullable field is not "required" from an editor's point of view: the
  // key must be present, but null is a legitimate value for it.
  return {
    name,
    required: !optional && !nullable,
    nullable,
    ...describe(name, inner),
  };
}

/**
 * Turns a collection's Zod object into editor fields. Every shape a schema
 * can hold has a control: nested objects become labelled groups, arrays of
 * objects become rows, image objects become a thumbnail with Swap image. The
 * editor never shows raw data, so there is no JSON escape hatch.
 */
export function fieldsFor(collection: Collection): FieldSpec[] {
  const shape = collectionSchemas[collection].shape as Record<string, z.ZodTypeAny>;
  // A singleton's slug is fixed and set by the save action, so showing it as
  // an editable field invites an edit that is silently discarded.
  const entries = Object.entries(shape).filter(
    ([name]) => !(isSingleton(collection) && name === 'slug'),
  );
  return entries.map(([name, schema]) => toField(name, schema));
}
