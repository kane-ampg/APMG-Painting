import { listMedia } from '@/app/actions/media';
import { MediaBrowser } from '@/components/admin/media-browser';
import { MediaUpload } from '@/components/admin/media-upload';
import { mediaUsage } from '@/lib/admin/pages';
import { requireAdmin } from '@/lib/auth/admin';

export default async function MediaLibraryPage() {
  await requireAdmin();
  const [rows, usage] = await Promise.all([listMedia(), mediaUsage()]);

  return (
    <>
      <h1 className="font-display text-3xl tracking-tight">Media</h1>
      <p className="mt-3 max-w-prose text-ink-soft">
        Every photograph the site can place. Upload a new one, or pick one to change its
        description.
      </p>
      <div className="mt-6">
        <MediaUpload />
      </div>
      <div className="mt-8">
        <MediaBrowser media={rows} usage={Object.fromEntries(usage)} />
      </div>
    </>
  );
}
