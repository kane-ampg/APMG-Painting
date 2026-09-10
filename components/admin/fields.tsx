'use client';

import { useId, useState } from 'react';
import type { MediaRow } from '@/app/actions/media';
import { labelFor } from '@/lib/admin/labels';
import type { FieldSpec } from '@/lib/content/form-fields';
import { isPlaceholder, type MediaRef } from '@/lib/content/types';
import { toMediaRef } from '@/lib/media/to-media-ref';
import { AiButton } from './ai-button';
import { MediaModal, dimensionsOf, fileNameOf } from './media-modal';

/**
 * One control per schema shape.
 *
 * Everything here is named from lib/admin/labels.ts — an editor never sees a
 * field's key. Lists gain and lose items because they are text; nothing here
 * reorders anything, adds a section or creates a page, because those are
 * layout, and layout is code (spec §5).
 */

export type FieldProps = {
  collection: string;
  /** Dotted path used to look the label up: `address.street`. */
  path: string;
  spec: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
  media: MediaRow[];
  errors?: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? [...value] : [];
}

function Help({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="text-xs text-ink-soft">{text}</p>;
}

function Errors({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-red-700">{errors.join(' ')}</p>;
}

function CharCount({ value, limit }: { value: string; limit?: number }) {
  if (!limit) return null;
  const over = value.length > limit;
  return (
    <p className={`text-xs ${over ? 'text-red-700' : 'text-ink-muted'}`}>
      {value.length} of {limit} characters
    </p>
  );
}

const inputClass =
  'rounded border border-paper-edge bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted';

/**
 * The thumbnail, its description and Swap image, shared by images and
 * galleries.
 *
 * There is no Remove. Where the site places a photograph it always places
 * one, so emptying the field would leave a hole on a public page that only a
 * developer could fill; an editor changes which picture it is, not whether
 * there is one.
 */
function ImageControl({
  media,
  value,
  onChange,
  labelledBy,
  altLabel = 'Description of the picture',
  altHelp = 'What the picture shows, for screen readers and Google.',
}: {
  media: MediaRow[];
  value: MediaRef | undefined;
  onChange: (ref: MediaRef) => void;
  /** Id of the element naming this field, so the button says which one it is. */
  labelledBy?: string;
  altLabel?: string;
  altHelp?: string;
}) {
  const [open, setOpen] = useState(false);
  const altId = useId();
  const buttonId = useId();
  const thumbId = useId();
  const swapLabel = value?.src ? 'Swap image' : 'Choose an image';
  return (
    <div className="flex flex-col gap-3 rounded border border-paper-edge bg-white p-3 sm:flex-row sm:items-start">
      <div className="sm:w-40 sm:shrink-0">
        {/* The picture is the biggest target on the row, so it opens the same
            library the button does. */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-labelledby={labelledBy ? `${labelledBy} ${thumbId}` : thumbId}
          className="block w-full rounded border border-transparent hover:border-brand-600"
        >
          <span id={thumbId} className="sr-only">
            Change this picture
          </span>
          {value?.src ? (
            // Plain img: an admin thumbnail, not a public asset.
            <img
              src={value.src}
              alt=""
              className="h-28 w-full rounded bg-paper-sunken object-contain"
            />
          ) : (
            <span className="flex h-28 w-full items-center justify-center rounded bg-paper-sunken text-xs text-ink-muted">
              No picture yet
            </span>
          )}
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <label htmlFor={altId} className="text-xs font-medium text-ink-soft">
          {altLabel}
        </label>
        <textarea
          id={altId}
          rows={2}
          className={inputClass}
          value={value?.alt ?? ''}
          onChange={(event) => onChange({ ...(value ?? { src: '' }), alt: event.target.value })}
        />
        <Help text={altHelp} />
        <div className="flex flex-wrap items-center gap-3">
          {/* Both ids on purpose: the field's name, then this button's own
              text, so the accessible name reads "Cover photograph, Swap
              image" rather than losing one half to the other. */}
          <button
            type="button"
            id={buttonId}
            onClick={() => setOpen(true)}
            aria-labelledby={labelledBy ? `${labelledBy} ${buttonId}` : undefined}
            className="rounded border border-paper-edge bg-paper px-3 py-1.5 text-sm hover:border-brand-600"
          >
            {swapLabel}
          </button>
          {value?.src && (
            <AiButton
              task="describe-image"
              input={{ imageUrl: value.src }}
              onResult={(result) => onChange({ ...value, alt: result.alt ?? value.alt })}
            />
          )}
        </div>
        {value?.src && <p className="break-all text-xs text-ink-muted">{fileNameOf(value.src)}</p>}
      </div>
      {open && (
        <MediaModal
          media={media}
          onClose={() => setOpen(false)}
          onSelect={(row) => {
            // The library's own description is the starting point; whatever
            // the editor has already written for this placement wins.
            const picked = toMediaRef(row);
            onChange({ ...picked, alt: value?.alt?.trim() ? value.alt : picked.alt });
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ListControl({
  label,
  labelledBy,
  items,
  onChange,
  itemNoun,
}: {
  label: string;
  labelledBy: string;
  items: string[];
  onChange: (items: string[]) => void;
  itemNoun: string;
}) {
  return (
    <div className="flex flex-col gap-2" role="group" aria-labelledby={labelledBy}>
      {items.length === 0 && <p className="text-xs text-ink-soft">Nothing here yet.</p>}
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            aria-label={`${label}, item ${index + 1}`}
            className={`${inputClass} flex-1`}
            value={item}
            onChange={(event) => {
              const next = [...items];
              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            className="rounded border border-paper-edge px-2 py-1.5 text-xs text-ink-soft hover:border-red-700 hover:text-red-700"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="self-start rounded border border-paper-edge bg-paper px-3 py-1.5 text-sm hover:border-brand-600"
        onClick={() => onChange([...items, ''])}
      >
        Add {itemNoun}
      </button>
    </div>
  );
}

/**
 * A project's photographs, one row each.
 *
 * Swap only. The number of photographs and their order are what the page's
 * layout is built around, so they are code; which photograph sits in each
 * slot is content, and that is what this changes. `coverOnly` narrows it to
 * the first row for the places that only render a card.
 */
function GalleryControl({
  media,
  images,
  onChange,
  labelledBy,
  coverOnly = false,
}: {
  media: MediaRow[];
  images: Record<string, unknown>[];
  onChange: (images: Record<string, unknown>[]) => void;
  labelledBy?: string;
  coverOnly?: boolean;
}) {
  const shown = coverOnly ? images.slice(0, 1) : images;
  return (
    <div className="flex flex-col gap-3">
      {shown.length === 0 && <p className="text-xs text-ink-soft">No photographs yet.</p>}
      {shown.map((image, index) => (
        <div key={index} className="flex flex-col gap-2">
          {!coverOnly && (
            <p className="text-xs font-medium uppercase tracking-label text-ink-muted">
              {index === 0 ? 'Cover photograph' : `Photograph ${index + 1}`}
            </p>
          )}
          <ImageControl
            media={media}
            labelledBy={labelledBy}
            value={image as MediaRef}
            onChange={(ref) => {
              const next = [...images];
              next[index] = { ...images[index], ...ref };
              onChange(next);
            }}
          />
          {!coverOnly && (
            <label className="flex items-center gap-2 text-xs text-ink-soft">
              Stage
              <select
                className={inputClass}
                value={String(image.phase ?? '')}
                onChange={(event) => {
                  const next = [...images];
                  const phase = event.target.value;
                  const row = { ...images[index] };
                  if (phase === '') delete row.phase;
                  else row.phase = phase;
                  next[index] = row;
                  onChange(next);
                }}
              >
                <option value="">Not marked</option>
                <option value="before">Before</option>
                <option value="after">After</option>
              </select>
            </label>
          )}
        </div>
      ))}
    </div>
  );
}

function TestimonialControl({
  collection,
  path,
  value,
  onChange,
}: {
  collection: string;
  path: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const quote = asRecord(value);
  const present = !isPlaceholder(value) && typeof quote.quote === 'string';
  const ids = useId();

  if (!present) {
    return (
      <div className="flex flex-col gap-2 rounded border border-paper-edge bg-white p-3">
        <p className="text-sm text-ink-soft">
          {isPlaceholder(value) ? String((value as { note: string }).note) : 'No testimonial.'}
        </p>
        <button
          type="button"
          className="self-start rounded border border-paper-edge bg-paper px-3 py-1.5 text-sm hover:border-brand-600"
          onClick={() => onChange({ quote: '', attribution: '' })}
        >
          Add a testimonial
        </button>
      </div>
    );
  }

  const set = (key: string, next: string) => onChange({ ...quote, [key]: next });
  const parts: { key: string; rows?: number }[] = [
    { key: 'quote', rows: 3 },
    { key: 'attribution' },
    { key: 'role' },
    { key: 'organisation' },
  ];

  return (
    <div className="flex flex-col gap-3 rounded border border-paper-edge bg-white p-3">
      {parts.map(({ key, rows }) => {
        const { label } = labelFor(collection, `${path}.${key}`);
        const id = `${ids}-${key}`;
        return (
          <div key={key} className="flex flex-col gap-1">
            <label htmlFor={id} className="text-xs font-medium text-ink-soft">
              {label}
            </label>
            {rows ? (
              <textarea
                id={id}
                rows={rows}
                className={inputClass}
                value={String(quote[key] ?? '')}
                onChange={(event) => set(key, event.target.value)}
              />
            ) : (
              <input
                id={id}
                type="text"
                className={inputClass}
                value={String(quote[key] ?? '')}
                onChange={(event) => set(key, event.target.value)}
              />
            )}
          </div>
        );
      })}
      <button
        type="button"
        className="self-start text-sm text-ink-soft underline"
        onClick={() => onChange(undefined)}
      >
        Remove the testimonial
      </button>
    </div>
  );
}

/** One field, whatever shape the schema gave it. Recurses for nested groups. */
export function Field({ collection, path, spec, value, onChange, media, errors }: FieldProps) {
  const { label, help } = labelFor(collection, path);
  const id = useId();
  const inputId = `${id}-${spec.name}`;
  const required = spec.required && spec.kind !== 'boolean';

  const heading = (
    <label htmlFor={inputId} className="text-sm font-medium text-ink">
      {label}
      {required && <span aria-hidden="true"> *</span>}
    </label>
  );
  // A control that is not a single form element cannot be the target of a
  // `<label for>` — the name is a plain span, tied to the group instead.
  const groupHeading = (
    <span id={inputId} className="text-sm font-medium text-ink">
      {label}
      {required && <span aria-hidden="true"> *</span>}
    </span>
  );

  const wrap = (children: React.ReactNode, labelNode: React.ReactNode = heading) => (
    <div className="flex flex-col gap-1.5">
      {labelNode}
      {children}
      <Help text={help} />
      <Errors errors={errors} />
    </div>
  );

  switch (spec.kind) {
    case 'boolean':
      return (
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              id={inputId}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) => onChange(event.target.checked)}
            />
            {label}
          </label>
          <Help text={help} />
          <Errors errors={errors} />
        </div>
      );

    case 'image':
      return wrap(
        <ImageControl
          media={media}
          labelledBy={inputId}
          value={value as MediaRef | undefined}
          onChange={(ref) => onChange(ref)}
        />,
        groupHeading,
      );

    case 'gallery':
      return wrap(
        <GalleryControl
          media={media}
          labelledBy={inputId}
          coverOnly={spec.coverOnly}
          images={asArray(value).map((item) => asRecord(item))}
          onChange={(next) => onChange(next)}
        />,
        groupHeading,
      );

    case 'testimonial':
      return wrap(
        <TestimonialControl
          collection={collection}
          path={path}
          value={value}
          onChange={onChange}
        />,
        groupHeading,
      );

    case 'lines':
      return wrap(
        <ListControl
          label={label}
          labelledBy={inputId}
          items={asArray(value).map((item) => String(item ?? ''))}
          onChange={(items) => onChange(items)}
          itemNoun="item"
        />,
        groupHeading,
      );

    case 'group': {
      const record = asRecord(value);
      const cleared = spec.nullable && value === null;
      return wrap(
        <div className="flex flex-col gap-3 rounded border border-paper-edge bg-white p-3">
          {cleared ? (
            <>
              <p className="text-sm text-ink-soft">Not set.</p>
              <button
                type="button"
                className="self-start rounded border border-paper-edge bg-paper px-3 py-1.5 text-sm hover:border-brand-600"
                onClick={() => onChange({})}
              >
                Add {label.toLowerCase()}
              </button>
            </>
          ) : (
            <>
              {(spec.children ?? []).map((child) => (
                <Field
                  key={child.name}
                  collection={collection}
                  path={`${path}.${child.name}`}
                  spec={child}
                  value={record[child.name]}
                  onChange={(next) => onChange({ ...record, [child.name]: next })}
                  media={media}
                />
              ))}
              {spec.nullable && (
                <button
                  type="button"
                  className="self-start text-sm text-ink-soft underline"
                  onClick={() => onChange(null)}
                >
                  Clear {label.toLowerCase()}
                </button>
              )}
            </>
          )}
        </div>,
        groupHeading,
      );
    }

    case 'group-list': {
      const rows = asArray(value).map((item) => asRecord(item));
      const blank = Object.fromEntries(
        (spec.children ?? []).map((child) => [child.name, child.kind === 'lines' ? [] : '']),
      );
      return wrap(
        <div className="flex flex-col gap-3">
          {rows.length === 0 && <p className="text-xs text-ink-soft">Nothing here yet.</p>}
          {rows.map((row, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded border border-paper-edge bg-white p-3"
            >
              {(spec.children ?? []).map((child) => (
                <Field
                  key={child.name}
                  collection={collection}
                  path={`${path}.${child.name}`}
                  spec={child}
                  value={row[child.name]}
                  onChange={(next) => {
                    const copy = [...rows];
                    copy[index] = { ...row, [child.name]: next };
                    onChange(copy);
                  }}
                  media={media}
                />
              ))}
              <button
                type="button"
                className="self-start text-sm text-ink-soft underline"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="self-start rounded border border-paper-edge bg-paper px-3 py-1.5 text-sm hover:border-brand-600"
            onClick={() => onChange([...rows, blank])}
          >
            Add {label.toLowerCase()}
          </button>
        </div>,
        groupHeading,
      );
    }

    case 'select':
      return wrap(
        <select
          id={inputId}
          className={inputClass}
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
        >
          {!spec.required && <option value="">Not set</option>}
          {(spec.options ?? []).map((option) => (
            <option key={option} value={option}>
              {spec.optionLabels?.[option] ?? option}
            </option>
          ))}
        </select>,
      );

    case 'number':
      return wrap(
        <input
          id={inputId}
          type="number"
          step="any"
          className={inputClass}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(event) => onChange(event.target.value)}
        />,
      );

    case 'textarea': {
      const text = isPlaceholder(value) ? '' : String(value ?? '');
      return (
        <div className="flex flex-col gap-1.5">
          {heading}
          <textarea
            id={inputId}
            rows={spec.name === 'body' ? 18 : 4}
            className={inputClass}
            value={text}
            onChange={(event) => onChange(event.target.value)}
          />
          <Help text={help} />
          <CharCount value={text} limit={spec.maxLength} />
          <Errors errors={errors} />
        </div>
      );
    }

    default: {
      const text = isPlaceholder(value) ? '' : String(value ?? '');
      return (
        <div className="flex flex-col gap-1.5">
          {heading}
          <input
            id={inputId}
            type={spec.kind === 'date' ? 'date' : 'text'}
            className={inputClass}
            value={text}
            onChange={(event) => onChange(event.target.value)}
          />
          <Help text={help} />
          {isPlaceholder(value) && (
            <p className="text-xs text-ink-soft">
              Awaiting confirmation: {String((value as { note: string }).note)}
            </p>
          )}
          <CharCount value={text} limit={spec.maxLength} />
          <Errors errors={errors} />
        </div>
      );
    }
  }
}

export { dimensionsOf, fileNameOf };
