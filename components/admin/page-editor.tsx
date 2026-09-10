'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { saveEntry } from '@/app/actions/content';
import type { MediaRow } from '@/app/actions/media';
import type { FieldSpec } from '@/lib/content/form-fields';
import { EntryFieldSet, buildSubmission, type FieldGroup } from './entry-form';

/** One entry an editor can change from this page. */
export type EditableEntry = {
  /** Unique within the page: a section can show the same entry twice. */
  key: string;
  title: string;
  collection: string;
  slug: string;
  status: 'draft' | 'published';
  data: Record<string, unknown>;
  fields: FieldSpec[];
  groups?: readonly FieldGroup[];
  advanced?: readonly string[];
};

export type SectionModel =
  | { kind: 'fixed'; id: string; heading: string; detail: string }
  | {
      kind: 'settings';
      id: string;
      heading: string;
      detail?: string;
      values: { label: string; value: string }[];
    }
  | {
      kind: 'entries';
      id: string;
      heading: string;
      detail?: string;
      entries: EditableEntry[];
      /** Shown instead of the entries when there are none. */
      empty?: string;
    };

type Props = {
  pagePath: string;
  sections: SectionModel[];
  media: MediaRow[];
  fixedNote: string;
};

type SaveOutcome = { title: string; ok: boolean; message?: string };

function Chip({ children, tone }: { children: React.ReactNode; tone: 'edited' | 'quiet' }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        tone === 'edited' ? 'bg-brand-50 text-brand-700' : 'bg-paper-sunken text-ink-soft'
      }`}
    >
      {children}
    </span>
  );
}

/**
 * A public page, as the sections it is made of, with one Save for the lot.
 *
 * The sections of a page belong to several entries — five services, three
 * projects, a settings row — and giving each its own Save button asked the
 * editor to understand the storage in order to press the right one. The
 * drafts all live here instead, and the action bar writes every changed entry
 * in turn through the same `saveEntry` action, unchanged.
 */
export function PageEditor({ pagePath, sections, media, fixedNote }: Props) {
  const entries = useMemo(
    () =>
      sections.flatMap((section) => (section.kind === 'entries' ? section.entries : [])),
    [sections],
  );

  const initial = useMemo(() => {
    const out: Record<string, Record<string, unknown>> = {};
    for (const entry of entries) out[entry.key] = entry.data;
    return out;
  }, [entries]);

  const [drafts, setDrafts] = useState<Record<string, Record<string, unknown>>>(initial);
  const [errors, setErrors] = useState<Record<string, Record<string, string[]>>>({});
  const [outcomes, setOutcomes] = useState<SaveOutcome[] | null>(null);
  const [pending, start] = useTransition();

  const payloadFor = (entry: EditableEntry) =>
    buildSubmission(entry.fields, drafts[entry.key] ?? entry.data, entry.data);

  const baseline = useMemo(() => {
    const out: Record<string, string> = {};
    for (const entry of entries) {
      out[entry.key] = JSON.stringify(buildSubmission(entry.fields, entry.data, entry.data));
    }
    return out;
  }, [entries]);

  const dirtyKeys = entries
    .filter((entry) => JSON.stringify(payloadFor(entry)) !== baseline[entry.key])
    .map((entry) => entry.key);
  const isDirty = dirtyKeys.length > 0;

  // Leaving with unsaved work loses it: nothing on this screen autosaves.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const setField = (key: string, name: string, value: unknown) =>
    setDrafts((current) => ({ ...current, [key]: { ...current[key], [name]: value } }));

  const save = (status: 'draft' | 'published') =>
    start(async () => {
      setOutcomes(null);
      const results: SaveOutcome[] = [];
      const fieldErrors: Record<string, Record<string, string[]>> = {};
      for (const entry of entries) {
        if (!dirtyKeys.includes(entry.key)) continue;
        const form = new FormData();
        form.set('collection', entry.collection);
        form.set('slug', entry.slug);
        form.set('originalSlug', entry.slug);
        form.set('previousStatus', entry.status);
        form.set('status', status);
        form.set('data', JSON.stringify(payloadFor(entry)));
        const result = await saveEntry({ status: 'idle' }, form);
        if (result.fieldErrors) fieldErrors[entry.key] = result.fieldErrors;
        results.push({
          title: entry.title,
          ok: result.status === 'ok',
          message: result.message,
        });
      }
      setErrors(fieldErrors);
      setOutcomes(results);
    });

  const summary = (): { tone: 'ok' | 'error'; text: string } | null => {
    if (!outcomes) return null;
    if (outcomes.length === 0) return { tone: 'ok', text: 'Nothing has changed on this page yet.' };
    const messages = new Set(outcomes.map((outcome) => outcome.message ?? ''));
    const failed = outcomes.filter((outcome) => !outcome.ok);
    // Every entry hitting the same wall — local preview, most often — is one
    // fact about the page, not one fact per card.
    if (failed.length === outcomes.length && messages.size === 1) {
      return { tone: 'error', text: [...messages][0] ?? 'Nothing was saved.' };
    }
    const saved = outcomes.filter((outcome) => outcome.ok).map((outcome) => outcome.title);
    const parts: string[] = [];
    if (saved.length > 0) parts.push(`Saved ${saved.join(', ')}.`);
    for (const outcome of failed) parts.push(`${outcome.title}: ${outcome.message ?? 'failed.'}`);
    return { tone: failed.length > 0 ? 'error' : 'ok', text: parts.join(' ') };
  };

  const status = summary();

  return (
    <>
      <div className="flex flex-col gap-6 pb-28">
        {sections.map((section) => {
          if (section.kind === 'fixed') {
            return (
              <div
                key={section.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded border border-paper-edge bg-paper-sunken px-4 py-3"
              >
                <h2 className="text-sm font-medium text-ink-soft">{section.heading}</h2>
                <p className="text-sm text-ink-muted">{section.detail}</p>
                <p className="ml-auto text-xs text-ink-muted">{fixedNote}</p>
              </div>
            );
          }

          if (section.kind === 'settings') {
            return (
              <section
                key={section.id}
                className="rounded-lg border border-paper-edge bg-paper-sunken p-5"
              >
                <h2 className="font-display text-xl tracking-tight text-ink">{section.heading}</h2>
                {section.detail && <p className="mt-1 text-sm text-ink-soft">{section.detail}</p>}
                <dl className="mt-4 flex flex-col gap-2 text-sm">
                  {section.values.map((row) => (
                    <div key={row.label} className="flex flex-wrap gap-2">
                      <dt className="font-medium text-ink">{row.label}</dt>
                      <dd className="text-ink-soft">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-sm">
                  <Link href="/admin/settings/site/" className="underline">
                    Edit business details
                  </Link>
                </p>
              </section>
            );
          }

          return (
            <section key={section.id} className="rounded-lg border border-paper-edge bg-white p-5">
              <h2 className="font-display text-xl tracking-tight text-ink">{section.heading}</h2>
              {section.detail && <p className="mt-1 text-sm text-ink-soft">{section.detail}</p>}
              {section.entries.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">
                  {section.empty ?? 'Nothing to show here yet.'}
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-8">
                  {section.entries.map((entry) => {
                    const dirty = dirtyKeys.includes(entry.key);
                    return (
                      <div
                        key={entry.key}
                        className="rounded border border-paper-edge bg-paper p-4"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-display text-lg tracking-tight text-ink">
                            {entry.title}
                          </h3>
                          <Chip tone={dirty ? 'edited' : 'quiet'}>
                            {dirty
                              ? 'Edited'
                              : entry.status === 'published'
                                ? 'Published'
                                : 'Draft'}
                          </Chip>
                        </div>
                        <div className="mt-4">
                          <EntryFieldSet
                            collection={entry.collection}
                            fields={entry.fields}
                            data={drafts[entry.key] ?? entry.data}
                            onChange={(name, value) => setField(entry.key, name, value)}
                            media={media}
                            errors={errors[entry.key]}
                            groups={entry.groups}
                            advanced={entry.advanced}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="sticky bottom-0 -mx-6 border-t border-paper-edge bg-paper/95 px-6 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => save('draft')}
            disabled={pending || !isDirty}
            className="rounded border border-paper-edge px-4 py-2 text-sm disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => save('published')}
            disabled={pending || !isDirty}
            className="rounded bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Save and publish
          </button>
          <a href={pagePath} target="_blank" rel="noreferrer" className="text-sm underline">
            Preview
          </a>
          <span className="text-xs text-ink-soft">
            {isDirty
              ? `${dirtyKeys.length} unsaved ${dirtyKeys.length === 1 ? 'change' : 'changes'}`
              : 'No unsaved changes'}
          </span>
        </div>
        {status && (
          <p
            role="status"
            className={`mt-2 text-sm ${status.tone === 'error' ? 'text-red-700' : 'text-ink-soft'}`}
          >
            {status.text}
          </p>
        )}
      </div>
    </>
  );
}
