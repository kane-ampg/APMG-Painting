import Image from 'next/image';
import { listMedia } from '@/app/actions/media';
import { MediaAltEditor } from '@/components/admin/media-alt-editor';
import { MediaUpload } from '@/components/admin/media-upload';
import { requireAdmin } from '@/lib/auth/admin';

export default async function MediaLibraryPage() {
  await requireAdmin();
  const rows = await listMedia();
  return (
    <>
      <h1 className="font-display text-3xl tracking-tight">Media library</h1>
      <div className="mt-6">
        <MediaUpload />
      </div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded border border-paper-edge p-2 text-xs">
            <Image
              src={row.public_url}
              alt={row.alt}
              width={row.width}
              height={row.height}
              sizes="(min-width: 640px) 33vw, 100vw"
              placeholder="blur"
              blurDataURL={row.blur_data_url}
              className="aspect-[4/3] w-full rounded object-cover"
            />
            <p className="mt-2 break-all font-mono">{row.storage_path}</p>
            <MediaAltEditor id={row.id} publicUrl={row.public_url} alt={row.alt} />
          </li>
        ))}
      </ul>
    </>
  );
}
