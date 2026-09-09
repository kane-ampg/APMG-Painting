'use client';

import { useActionState, useMemo, useState } from 'react';
import { saveEntry, type SaveState } from '@/app/actions/content';
import type { MediaRow } from '@/app/actions/media';
import type { FieldSpec } from '@/lib/content/form-fields';
import type { MediaRef } from '@/lib/content/types';
import { MediaPicker } from './media-picker';
import { AiButton } from './ai-button';

type Props = {
  collection: string;
  fields: FieldSpec[];
  initial: Record<string, unknown>;
  initialStatus: 'draft' | 'published';
  media: MediaRow[];
};

/** Renders a `lines` field's initial array as one item per line. */
function linesToText(value: unknown): string {
  return Array.isArray(value) ? (value as unknown[]).map(String).join('\n') : '';
}

/** Renders a `json` field's initial value as pretty-printed JSON, or blank. */
function jsonToText(value: unknown): string {
  return value === undefined ? '' : JSON.stringify(value, null, 2);
}

export function EntryForm({ collection, fields, initial, initialStatus, media }: Props) {
  const [data, setData] = useState<Record<string, unknown>>(initial);
  // Raw textarea text for `lines` and `json` fields, tracked separately from
  // `data`. Deriving the array/object on every keystroke and feeding it back
  // as a controlled `value` fights the user: a `lines` textarea whose value
  // is `array.join('\n')` cannot end on a blank line (the trailing empty
  // item gets filtered before React ever renders it back), so pressing
  // Enter to start a new line is silently undone. Keeping the textarea's own
  // text as the source of truth — and deriving the submitted array/object
  // only at save time — lets the field behave like an ordinary textarea.
  const [text, setText] = useState<Record<string, string>>(() => {
    const initialText: Record<string, string> = {};
    for (const field of fields) {
      if (field.kind === 'lines') initialText[field.name] = linesToText(initial[field.name]);
      else if (field.kind === 'json') initialText[field.name] = jsonToText(initial[field.name]);
    }
    return initialText;
  });
  // Parse errors for `json` fields, keyed by field name. Non-empty blocks
  // both submit buttons — publishing (or saving a draft of) a field whose
  // visible text does not match what would actually be sent is exactly the
  // "silently discards the edit" failure this replaces.
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState<SaveState, FormData>(saveEntry, {
    status: 'idle',
  });
  const set = (name: string, value: unknown) => setData((d) => ({ ...d, [name]: value }));

  const setLinesText = (name: string, raw: string) => setText((t) => ({ ...t, [name]: raw }));

  const setJsonText = (name: string, raw: string) => {
    setText((t) => ({ ...t, [name]: raw }));
    const trimmed = raw.trim();
    if (trimmed === '') {
      setJsonErrors((errors) => {
        if (!(name in errors)) return errors;
        const next = { ...errors };
        delete next[name];
        return next;
      });
      return;
    }
    try {
      JSON.parse(trimmed);
      setJsonErrors((errors) => {
        if (!(name in errors)) return errors;
        const next = { ...errors };
        delete next[name];
        return next;
      });
    } catch (parseError) {
      setJsonErrors((errors) => ({
        ...errors,
        [name]: parseError instanceof Error ? parseError.message : 'Invalid JSON.',
      }));
    }
  };

  // What actually gets submitted: `data` for ordinary fields, with `lines`
  // and `json` fields derived from their raw text right here rather than on
  // every keystroke. A `json` field currently showing invalid text keeps its
  // last valid parsed value here — harmless, because `hasJsonErrors` below
  // disables both submit buttons whenever that is the case.
  const submission = useMemo(() => {
    const out: Record<string, unknown> = { ...data };
    for (const field of fields) {
      if (field.kind === 'lines') {
        out[field.name] = (text[field.name] ?? '')
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line !== '');
      } else if (field.kind === 'json') {
        const raw = (text[field.name] ?? '').trim();
        if (raw === '') {
          out[field.name] = undefined;
        } else {
          try {
            out[field.name] = JSON.parse(raw);
          } catch {
            // Invalid text: keep whatever was last valid. hasJsonErrors
            // disables the buttons, so this value is never actually sent.
            out[field.name] = data[field.name];
          }
        }
      }
    }
    return out;
  }, [data, text, fields]);

  const hasJsonErrors = Object.keys(jsonErrors).length > 0;
  const slug = String(data.slug ?? '');
  const originalSlug = String(initial.slug ?? '');

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="collection" value={collection} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="originalSlug" value={originalSlug} />
      <input type="hidden" name="previousStatus" value={initialStatus} />
      <input type="hidden" name="data" value={JSON.stringify(submission)} />

      {fields.map((field) => {
        const errors = state.fieldErrors?.[field.name];
        const value = data[field.name];
        const inputId = `field-${field.name}`;
        const label = (
          <label htmlFor={inputId} className="text-sm font-medium">
            {field.name}
            {field.required && <span aria-hidden="true"> *</span>}
          </label>
        );
        return (
          <div key={field.name} className="flex flex-col gap-1">
            {field.kind === 'boolean' ? (
              <label className="flex items-center gap-2">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => set(field.name, e.target.checked)}
                />
                <span className="text-sm font-medium">
                  {field.name}
                  {field.required && <span aria-hidden="true"> *</span>}
                </span>
              </label>
            ) : field.kind === 'image' ? (
              <>
                {label}
                <MediaPicker
                  media={media}
                  value={value as MediaRef | undefined}
                  onChange={(r) => set(field.name, r)}
                />
              </>
            ) : field.kind === 'lines' ? (
              <>
                {label}
                <textarea
                  id={inputId}
                  rows={6}
                  className="rounded border border-paper-edge px-2 py-1 font-mono text-sm"
                  value={text[field.name] ?? ''}
                  onChange={(e) => setLinesText(field.name, e.target.value)}
                />
                <span className="text-xs text-ink-soft">One item per line.</span>
              </>
            ) : field.kind === 'json' ? (
              <>
                {label}
                <textarea
                  id={inputId}
                  rows={8}
                  className="rounded border border-paper-edge px-2 py-1 font-mono text-xs"
                  value={text[field.name] ?? ''}
                  onChange={(e) => setJsonText(field.name, e.target.value)}
                />
                {jsonErrors[field.name] && (
                  <p className="text-xs text-red-700">Invalid JSON: {jsonErrors[field.name]}</p>
                )}
              </>
            ) : field.kind === 'textarea' ? (
              <>
                <div className="flex items-center justify-between">
                  {label}
                  {collection === 'posts' && field.name === 'excerpt' && (
                    <AiButton
                      task="post-summary"
                      input={{ title: String(data.title ?? ''), body: String(data.body ?? '') }}
                      onResult={(r) => setData((d) => ({ ...d, ...r }))}
                    />
                  )}
                </div>
                <textarea
                  id={inputId}
                  rows={field.name === 'body' ? 20 : 4}
                  className="rounded border border-paper-edge px-2 py-1"
                  value={String(value ?? '')}
                  onChange={(e) => set(field.name, e.target.value)}
                />
                {field.name === 'metaDescription' && (
                  <span className="text-xs text-ink-soft">{String(value ?? '').length}/160</span>
                )}
              </>
            ) : (
              <>
                {label}
                <input
                  id={inputId}
                  type={field.kind === 'date' ? 'date' : 'text'}
                  className="rounded border border-paper-edge px-2 py-1"
                  value={String(value ?? '')}
                  onChange={(e) => set(field.name, e.target.value)}
                />
              </>
            )}
            {errors && <p className="text-xs text-red-700">{errors.join(' ')}</p>}
          </div>
        );
      })}

      <div className="flex items-center gap-3 border-t border-paper-edge pt-4">
        <button
          type="submit"
          name="status"
          value="draft"
          disabled={pending || hasJsonErrors}
          className="rounded border px-4 py-2"
        >
          Save draft
        </button>
        <button
          type="submit"
          name="status"
          value="published"
          disabled={pending || hasJsonErrors}
          className="rounded bg-brand-600 px-4 py-2 text-white"
        >
          Publish
        </button>
        {slug ? (
          <a
            href={`/admin/preview/${collection}/${slug}/`}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline"
          >
            Preview
          </a>
        ) : (
          <span aria-disabled="true" className="text-sm text-ink-muted">
            Preview
          </span>
        )}
        <span className="text-xs text-ink-soft">Currently: {initialStatus}</span>
      </div>
      {state.message && (
        <p role="status" className={state.status === 'error' ? 'text-red-700' : 'text-ink-soft'}>
          {state.message}
        </p>
      )}
    </form>
  );
}
