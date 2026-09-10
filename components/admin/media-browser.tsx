'use client';

import { useMemo, useState } from 'react';
import type { MediaRow } from '@/app/actions/media';
import { MediaAltEditor } from './media-alt-editor';
import { dimensionsOf, fileNameOf, filterMedia } from './media-modal';

type Props = {
  media: MediaRow[];
  /** Which pages place each image, keyed by its URL. */
  usage: Record<string, string[]>;
};

/**
 * The library grid, plus the panel that opens beside it.
 *
 * Search filters on the file name and the description, because those are the
 * two things an editor can remember about a photograph. Selecting a
 * thumbnail opens the larger view, its description and the pages it appears
 * on, so "can I change this one?" has an answer before it is changed.
 */
export function MediaBrowser({ media, usage }: Props) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => filterMedia(media, query), [media, query]);
  const selected = media.find((row) => row.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <label className="flex max-w-md flex-col gap-1 text-sm font-medium">
        Search
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="File name or description"
          className="rounded border border-paper-edge bg-white px-3 py-2 font-normal"
        />
      </label>

      <p className="text-sm text-ink-soft">
        {filtered.length} of {media.length} images
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setSelectedId(row.id)}
                aria-pressed={selectedId === row.id}
                className={`block w-full rounded-lg border bg-white p-2 text-left ${
                  selectedId === row.id ? 'border-brand-600' : 'border-paper-edge'
                } hover:border-brand-600`}
              >
                {/* Plain img: an admin thumbnail, not a public asset. */}
                <img
                  src={row.public_url}
                  alt=""
                  className="aspect-[4/3] w-full rounded bg-paper-sunken object-cover"
                />
                <span className="mt-2 block break-all text-xs font-medium text-ink">
                  {fileNameOf(row.public_url)}
                </span>
                <span className="block text-xs text-ink-muted">{dimensionsOf(row)}</span>
                <span className="mt-1 line-clamp-2 block text-xs text-ink-soft">
                  {row.alt || 'No description yet'}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <aside className="rounded-lg border border-paper-edge bg-paper-sunken p-4">
          {selected ? (
            <div className="flex flex-col gap-3">
              <img
                src={selected.public_url}
                alt=""
                className="w-full rounded bg-white object-contain"
              />
              <p className="break-all text-sm font-medium">{fileNameOf(selected.public_url)}</p>
              <p className="text-xs text-ink-muted">{dimensionsOf(selected)}</p>
              <MediaAltEditor id={selected.id} publicUrl={selected.public_url} alt={selected.alt} />
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-label text-ink-muted">
                  Used on
                </h2>
                {(usage[selected.public_url] ?? []).length > 0 ? (
                  <ul className="mt-1 flex flex-col gap-1 text-sm text-ink-soft">
                    {(usage[selected.public_url] ?? []).map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-ink-soft">Not placed on any page yet.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">
              Choose an image to see it larger, edit its description and check where it is used.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
