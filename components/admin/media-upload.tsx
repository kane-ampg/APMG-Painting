'use client';

import { useActionState } from 'react';
import { uploadMedia, type MediaActionState } from '@/app/actions/media';

export function MediaUpload() {
  const [state, action, pending] = useActionState<MediaActionState, FormData>(uploadMedia, {
    status: 'idle',
  });
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
        <textarea name="alt" required rows={2} className="mt-1 w-full rounded border px-2 py-1" />
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
