'use client';

import { useState, useTransition } from 'react';
import { updateMediaAlt } from '@/app/actions/media';
import { AiButton } from './ai-button';

type Props = { id: string; publicUrl: string; alt: string };

/**
 * Card control for the media library grid. "Describe with AI" fills the
 * textarea from the uploaded photo; it never saves on its own — the editor
 * still has to press Save, which is the only thing that calls
 * `updateMediaAlt`.
 */
export function MediaAltEditor({ id, publicUrl, alt: initialAlt }: Props) {
  const [alt, setAlt] = useState(initialAlt);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const save = () =>
    start(async () => {
      setMessage(null);
      try {
        await updateMediaAlt(id, alt);
        setMessage('Saved.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not save.');
      }
    });

  return (
    <div className="mt-2 flex flex-col gap-1">
      <label className="sr-only" htmlFor={`alt-${id}`}>
        Description of the picture
      </label>
      <textarea
        id={`alt-${id}`}
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        rows={2}
        className="w-full rounded border border-paper-edge px-2 py-1 text-xs"
      />
      <p className="text-xs text-ink-soft">
        Changes the library default. Images already placed on a page keep their alt text until
        re-picked.
      </p>
      {!alt.trim() && <p className="text-xs text-red-700">No description yet</p>}
      <div className="flex items-center gap-2">
        <AiButton
          task="describe-image"
          input={{ imageUrl: publicUrl }}
          onResult={(r) => setAlt(r.alt ?? alt)}
        />
        <button
          type="button"
          onClick={save}
          disabled={pending || alt.trim() === ''}
          className="rounded border px-2 py-1 text-xs"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {message && <span className="text-xs text-ink-soft">{message}</span>}
      </div>
    </div>
  );
}
