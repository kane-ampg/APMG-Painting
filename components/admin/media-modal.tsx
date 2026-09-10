'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MediaRow } from '@/app/actions/media';
import { MediaUpload } from './media-upload';

type Props = {
  media: MediaRow[];
  onSelect: (row: MediaRow) => void;
  onClose: () => void;
  heading?: string;
};

/**
 * The media library, in a dialog, wherever an image is chosen.
 *
 * Rendered through a portal on purpose. Every caller is inside the entry
 * form, and the upload drop zone is itself a form — nesting one inside the
 * other is invalid HTML and the browser drops the inner one, taking the
 * upload with it. The portal puts this whole subtree on `document.body`
 * instead, outside any form.
 *
 * Choosing an image only fills the field in. Nothing is saved until the
 * editor presses Save.
 */
export function MediaModal({ media, onSelect, onClose, heading = 'Choose an image' }: Props) {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filtered = useMemo(() => filterMedia(media, query), [media, query]);

  // This only ever renders after a click, so `document` is always there — but
  // the module is still evaluated on the server, where it is not.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 sm:p-8">
      {/* The backdrop closes the dialog. It is a button so the keyboard can
          reach the same escape hatch the pointer has. */}
      <button
        type="button"
        aria-label="Close the image library"
        className="fixed inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className="relative w-full max-w-4xl rounded-lg border border-paper-edge bg-paper shadow-xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-edge px-5 py-4">
          <h2 className="font-display text-xl tracking-tight">{heading}</h2>
          <button type="button" onClick={onClose} className="text-sm underline">
            Close
          </button>
        </div>

        <div className="flex flex-col gap-5 px-5 py-5">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Search
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="File name or description"
              className="rounded border border-paper-edge bg-white px-3 py-2 font-normal"
            />
          </label>

          {filtered.length === 0 ? (
            <p className="text-sm text-ink-soft">No images match that search.</p>
          ) : (
            <ul className="grid max-h-[26rem] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-4">
              {filtered.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(row)}
                    className="block w-full rounded border border-paper-edge bg-white p-2 text-left hover:border-brand-600"
                  >
                    {/* Plain img: an admin thumbnail, not a public asset. */}
                    <img
                      src={row.public_url}
                      alt=""
                      className="aspect-[4/3] w-full rounded bg-paper-sunken object-cover"
                    />
                    <span className="mt-2 block break-all text-xs text-ink">
                      {fileNameOf(row.public_url)}
                    </span>
                    <span className="block text-xs text-ink-muted">{dimensionsOf(row)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <details className="rounded border border-paper-edge bg-paper-sunken p-3">
            <summary className="cursor-pointer text-sm font-medium">Upload a new image</summary>
            <div className="mt-3">
              <MediaUpload />
            </div>
          </details>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function fileNameOf(url: string): string {
  return url.split('/').pop() ?? url;
}

export function dimensionsOf(row: Pick<MediaRow, 'width' | 'height'>): string {
  if (!row.width || !row.height) return 'Dimensions unknown';
  return `${row.width} × ${row.height}`;
}

export function filterMedia(media: MediaRow[], query: string): MediaRow[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return media;
  return media.filter(
    (row) =>
      row.public_url.toLowerCase().includes(needle) || row.alt.toLowerCase().includes(needle),
  );
}
