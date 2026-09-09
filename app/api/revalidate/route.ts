import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Called by the editor deployment after a publish (spec §8a). Only content
 * tags and site-relative paths are accepted, so a leaked secret can at worst
 * cause extra rebuilds of pages that already exist.
 */
const TAG = /^content:[a-z]+$/;
const PATH = /^\/(?!\.\.)[A-Za-z0-9\-._~/]*$/;

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 });

  const auth = request.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`)
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body: { tags?: unknown; paths?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === 'string' && TAG.test(t))
    : [];
  const paths = Array.isArray(body.paths)
    ? body.paths.filter(
        (p): p is string => typeof p === 'string' && PATH.test(p) && !p.includes('..'),
      )
    : [];

  for (const tag of tags) revalidateTag(tag, 'max');
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ revalidated: { tags, paths } });
}
