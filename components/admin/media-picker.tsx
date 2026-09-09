'use client';

import { useState } from 'react';
import type { MediaRow } from '@/app/actions/media';
import { toMediaRef } from '@/lib/media/to-media-ref';
import type { MediaRef } from '@/lib/content/types';

type Props = {
  media: MediaRow[];
  value?: MediaRef;
  onChange: (ref: MediaRef | undefined) => void;
  /**
   * Id of the element naming this field. There is no form control to point a
   * `<label for>` at — the picker is a disclosure button and a grid — so the
   * field's name reaches assistive technology through the button instead.
   */
  labelledBy?: string;
};

export function MediaPicker({ media, value, onChange, labelledBy }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="flex items-center gap-3">
          {/* Plain img: this is an admin thumbnail, not a public asset. */}
          <img src={value.src} alt={value.alt} className="h-16 w-24 rounded object-cover" />
          <div className="text-xs">
            <p className="max-w-xs truncate">{value.alt}</p>
            <button type="button" className="underline" onClick={() => onChange(undefined)}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-soft">No image.</p>
      )}
      {/* Both ids on purpose: the field's name, then this button's own text,
          so the accessible name reads "images, Choose from library" rather
          than losing one half to the other. Self-reference in
          aria-labelledby is allowed and is what keeps the action visible. */}
      <button
        type="button"
        id={labelledBy ? `${labelledBy}-action` : undefined}
        aria-labelledby={labelledBy ? `${labelledBy} ${labelledBy}-action` : undefined}
        className="self-start text-sm underline"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? 'Close library' : 'Choose from library'}
      </button>
      {open && (
        <ul className="grid max-h-72 grid-cols-4 gap-2 overflow-auto rounded border border-paper-edge p-2">
          {media.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="block w-full"
                onClick={() => {
                  onChange(toMediaRef(row));
                  setOpen(false);
                }}
              >
                <img
                  src={row.public_url}
                  alt={row.alt}
                  className="aspect-[4/3] w-full rounded object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
