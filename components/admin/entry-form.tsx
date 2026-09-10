'use client';

import { useActionState, useMemo, useState } from 'react';
import { saveEntry, type SaveState } from '@/app/actions/content';
import type { MediaRow } from '@/app/actions/media';
import type { FieldSpec } from '@/lib/content/form-fields';
import { isPlaceholder } from '@/lib/content/types';
import { Field } from './fields';
import { AiButton } from './ai-button';

export type FieldGroup = { heading: string; fields: readonly string[] };

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? [...value] : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * What actually gets submitted for one field.
 *
 * The controls keep whatever is easiest to type — an empty list row, a
 * half-filled testimonial, a number as text — and this turns that into the
 * shape the schema expects, once, at save time. An editorial placeholder the
 * editor did not replace is handed back untouched rather than dropped: it is
 * copy somebody wrote on purpose.
 */
export function cleanField(spec: FieldSpec, value: unknown, original: unknown): unknown {
  if (spec.allowsPlaceholder && isPlaceholder(original)) {
    const emptied =
      value === undefined ||
      value === '' ||
      isPlaceholder(value) ||
      (spec.kind === 'testimonial' && !String(asRecord(value).quote ?? '').trim());
    if (emptied) return original;
  }

  switch (spec.kind) {
    case 'lines':
      return asArray(value)
        .map((item) => String(item ?? '').trim())
        .filter((item) => item !== '');

    case 'gallery':
      return asArray(value)
        .map((item) => asRecord(item))
        .filter((item) => typeof item.src === 'string' && item.src !== '');

    case 'image':
      return value && typeof asRecord(value).src === 'string' && asRecord(value).src !== ''
        ? value
        : undefined;

    case 'testimonial': {
      if (value === undefined || value === null) return undefined;
      if (isPlaceholder(value)) return value;
      const record = asRecord(value);
      const quote = String(record.quote ?? '').trim();
      const attribution = String(record.attribution ?? '').trim();
      if (quote === '' && attribution === '') return undefined;
      const out: Record<string, unknown> = { quote, attribution };
      for (const key of ['role', 'organisation']) {
        const text = String(record[key] ?? '').trim();
        if (text !== '') out[key] = text;
      }
      return out;
    }

    case 'group': {
      if (value === null && spec.nullable) return null;
      const record = asRecord(value);
      const out: Record<string, unknown> = {};
      for (const child of spec.children ?? []) {
        const cleaned = cleanField(child, record[child.name], asRecord(original)[child.name]);
        if (cleaned !== undefined) out[child.name] = cleaned;
      }
      return out;
    }

    case 'group-list': {
      const rows = asArray(value).map((row) => {
        const record = asRecord(row);
        const out: Record<string, unknown> = {};
        for (const child of spec.children ?? []) {
          const cleaned = cleanField(child, record[child.name], undefined);
          if (cleaned !== undefined) out[child.name] = cleaned;
        }
        return out;
      });
      if (rows.length === 0 && spec.nullable) return null;
      return rows;
    }

    case 'number': {
      if (value === null || value === undefined || value === '') {
        return spec.nullable ? null : undefined;
      }
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }

    case 'boolean':
      return Boolean(value);

    default: {
      if (isPlaceholder(value)) return value;
      const text = value === null || value === undefined ? '' : String(value);
      // An emptied input on a nullable field means "there is none", which the
      // schema spells `null`. Submitting '' would fail validation instead.
      if (text === '' && spec.nullable) return null;
      if (text === '' && !spec.required) return undefined;
      return text;
    }
  }
}

/**
 * The payload. Every field the form shows is cleaned; everything else in the
 * entry rides along untouched, which is what lets a page-level form edit four
 * fields of a project without dropping the other fifteen.
 */
export function buildSubmission(
  fields: readonly FieldSpec[],
  data: Record<string, unknown>,
  initial: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const field of fields) {
    const cleaned = cleanField(field, data[field.name], initial[field.name]);
    if (cleaned === undefined) delete out[field.name];
    else out[field.name] = cleaned;
  }
  return out;
}

type FieldSetProps = {
  collection: string;
  fields: readonly FieldSpec[];
  data: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  media: MediaRow[];
  errors?: Record<string, string[]>;
  /** Field names to tuck into the collapsed Advanced group at the bottom. */
  advanced?: readonly string[];
  /** Optional headings that split the fields into labelled sets, in order. */
  groups?: readonly FieldGroup[];
};

/**
 * The fields of one entry, with no form and no buttons of its own.
 *
 * Separate from `EntryForm` because a page editor shows several entries at
 * once and saves them from a single action bar — one Save per page, not one
 * per card.
 */
export function EntryFieldSet({
  collection,
  fields,
  data,
  onChange,
  media,
  errors,
  advanced = [],
  groups,
}: FieldSetProps) {
  const byName = new Map(fields.map((field) => [field.name, field]));
  const isAdvanced = (name: string) => advanced.includes(name);
  const advancedSpecs = fields.filter((field) => isAdvanced(field.name));

  const renderField = (field: FieldSpec) => (
    <div key={field.name}>
      <Field
        collection={collection}
        path={field.name}
        spec={field}
        value={data[field.name]}
        onChange={(value) => onChange(field.name, value)}
        media={media}
        errors={errors?.[field.name]}
      />
      {collection === 'posts' && field.name === 'excerpt' && (
        <div className="mt-2">
          <AiButton
            task="post-summary"
            input={{ title: String(data.title ?? ''), body: String(data.body ?? '') }}
            onResult={(result) => {
              for (const [name, text] of Object.entries(result)) onChange(name, text);
            }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {groups
        ? groups.map((group) => {
            const specs = group.fields.flatMap((name) => {
              const spec = byName.get(name);
              return spec && !isAdvanced(spec.name) ? [spec] : [];
            });
            if (specs.length === 0) return null;
            return (
              <fieldset key={group.heading} className="flex flex-col gap-5">
                <legend className="font-display text-lg tracking-tight text-ink">
                  {group.heading}
                </legend>
                {specs.map(renderField)}
              </fieldset>
            );
          })
        : fields.filter((field) => !isAdvanced(field.name)).map(renderField)}

      {advancedSpecs.length > 0 && (
        <details className="rounded border border-paper-edge bg-paper-sunken p-4">
          <summary className="cursor-pointer text-sm font-medium">Advanced</summary>
          <p className="mt-2 text-xs text-ink-soft">
            Links, listings and dates. Changing these can move or hide the page.
          </p>
          <div className="mt-4 flex flex-col gap-5">{advancedSpecs.map(renderField)}</div>
        </details>
      )}
    </div>
  );
}

type Props = {
  collection: string;
  fields: FieldSpec[];
  initial: Record<string, unknown>;
  initialStatus: 'draft' | 'published';
  media: MediaRow[];
  advanced?: readonly string[];
  groups?: readonly FieldGroup[];
  /** Where Preview should go. Defaults to the draft preview for this entry. */
  previewHref?: string;
};

/**
 * One entry, one form, its own Save. Used by the collection editors, where an
 * entry is the whole screen. The page editor does not use this — it shows
 * several entries and saves them together.
 */
export function EntryForm({
  collection,
  fields,
  initial,
  initialStatus,
  media,
  advanced = [],
  groups,
  previewHref,
}: Props) {
  const [data, setData] = useState<Record<string, unknown>>(initial);
  const [state, action, pending] = useActionState<SaveState, FormData>(saveEntry, {
    status: 'idle',
  });
  const onChange = (name: string, value: unknown) => setData((d) => ({ ...d, [name]: value }));

  const submission = useMemo(() => buildSubmission(fields, data, initial), [data, fields, initial]);

  const slug = String(data.slug ?? initial.slug ?? '');
  const originalSlug = String(initial.slug ?? '');
  const preview = previewHref ?? (slug ? `/admin/preview/${collection}/${slug}/` : null);

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="collection" value={collection} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="originalSlug" value={originalSlug} />
      <input type="hidden" name="previousStatus" value={initialStatus} />
      <input type="hidden" name="data" value={JSON.stringify(submission)} />

      <EntryFieldSet
        collection={collection}
        fields={fields}
        data={data}
        onChange={onChange}
        media={media}
        errors={state.fieldErrors}
        advanced={advanced}
        groups={groups}
      />

      <div className="flex flex-wrap items-center gap-3 border-t border-paper-edge pt-4">
        <button
          type="submit"
          name="status"
          value="draft"
          disabled={pending}
          className="rounded border border-paper-edge px-4 py-2 text-sm"
        >
          Save draft
        </button>
        <button
          type="submit"
          name="status"
          value="published"
          disabled={pending}
          className="rounded bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
        >
          Publish
        </button>
        {preview ? (
          <a href={preview} target="_blank" rel="noreferrer" className="text-sm underline">
            Preview
          </a>
        ) : (
          <span aria-disabled="true" className="text-sm text-ink-muted">
            Preview
          </span>
        )}
        <span className="text-xs text-ink-soft">
          Currently {initialStatus === 'published' ? 'published' : 'a draft'}
        </span>
      </div>
      {state.message && (
        <p role="status" className={state.status === 'error' ? 'text-red-700' : 'text-ink-soft'}>
          {state.message}
        </p>
      )}
    </form>
  );
}
