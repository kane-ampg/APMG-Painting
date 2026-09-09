'use client';

import { useActionState, useState } from 'react';
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

export function EntryForm({ collection, fields, initial, initialStatus, media }: Props) {
  const [data, setData] = useState<Record<string, unknown>>(initial);
  const [state, action, pending] = useActionState<SaveState, FormData>(saveEntry, {
    status: 'idle',
  });
  const set = (name: string, value: unknown) => setData((d) => ({ ...d, [name]: value }));

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="collection" value={collection} />
      <input type="hidden" name="slug" value={String(data.slug ?? '')} />
      <input type="hidden" name="data" value={JSON.stringify(data)} />

      {fields.map((field) => {
        const errors = state.fieldErrors?.[field.name];
        const value = data[field.name];
        const label = (
          <span className="text-sm font-medium">
            {field.name}
            {field.required && <span aria-hidden="true"> *</span>}
          </span>
        );
        return (
          <div key={field.name} className="flex flex-col gap-1">
            {field.kind === 'boolean' ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => set(field.name, e.target.checked)}
                />
                {label}
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
                  rows={6}
                  className="rounded border border-paper-edge px-2 py-1 font-mono text-sm"
                  value={Array.isArray(value) ? (value as string[]).join('\n') : ''}
                  onChange={(e) =>
                    set(
                      field.name,
                      e.target.value.split('\n').filter((l) => l.trim() !== ''),
                    )
                  }
                />
                <span className="text-xs text-ink-soft">One item per line.</span>
              </>
            ) : field.kind === 'json' ? (
              <>
                {label}
                <textarea
                  rows={8}
                  className="rounded border border-paper-edge px-2 py-1 font-mono text-xs"
                  defaultValue={value === undefined ? '' : JSON.stringify(value, null, 2)}
                  onBlur={(e) => {
                    const text = e.target.value.trim();
                    if (text === '') return set(field.name, undefined);
                    try {
                      set(field.name, JSON.parse(text));
                    } catch {
                      // Leave the previous value; the save will report the schema error.
                    }
                  }}
                />
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
          disabled={pending}
          className="rounded border px-4 py-2"
        >
          Save draft
        </button>
        <button
          type="submit"
          name="status"
          value="published"
          disabled={pending}
          className="rounded bg-brand-600 px-4 py-2 text-white"
        >
          Publish
        </button>
        <a
          href={`/admin/preview/${collection}/${String(data.slug ?? '')}/`}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline"
        >
          Preview
        </a>
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
