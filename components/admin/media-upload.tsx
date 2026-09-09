'use client';

import { useActionState, useState } from 'react';
import { uploadMedia, type MediaActionState } from '@/app/actions/media';

export function MediaUpload() {
  const [state, action, pending] = useActionState<MediaActionState, FormData>(uploadMedia, {
    status: 'idle',
  });
  // Alt text is normally required at upload time, but "Describe with AI"
  // needs a public URL that does not exist until the file is uploaded.
  // Checking this box relaxes the requirement here; the grid then shows
  // "No alt text" in red until it is filled in with MediaAltEditor.
  const [describeLater, setDescribeLater] = useState(false);
  return (
    <form action={action} className="flex flex-col gap-3 rounded border border-paper-edge p-4">
      <h2 className="font-display text-xl">Upload an image</h2>
      <input name="file" type="file" accept="image/webp,image/jpeg,image/png,image/avif" required />
      <label className="text-sm">
        Folder
        <select name="folder" defaultValue="work" className="ml-2 rounded border px-2 py-1">
          <option value="projects">projects</option>
          <option value="work">work</option>
          <option value="blog">blog</option>
          <option value="hero">hero</option>
        </select>
      </label>
      <label className="text-sm">
        Alt text (what the picture shows, for screen readers and Google)
        <textarea
          name="alt"
          required={!describeLater}
          rows={2}
          className="mt-1 w-full rounded border px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="describeLater"
          checked={describeLater}
          onChange={(e) => setDescribeLater(e.target.checked)}
        />
        I&rsquo;ll describe this with AI after uploading
      </label>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-brand-600 px-4 py-2 text-white"
      >
        {pending ? 'Uploading…' : 'Upload'}
      </button>
      {state.message && (
        <p role="status" className={state.status === 'error' ? 'text-red-700' : 'text-ink-soft'}>
          {state.message}
        </p>
      )}
    </form>
  );
}
