import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Called by the editor deployment after a publish (spec §8a). Only content
 * tags and site-relative paths are accepted, so a leaked secret can at worst
 * cause extra rebuilds of pages that already exist.
 */
const TAG = /^content:[a-z]+$/;
const PATH = /^\/(?!\.\.)[A-Za-z0-9\-._~/]*$/;

/**
 * Constant-time comparison so a wrong bearer cannot be brute-forced by
 * timing the response. Buffers of different lengths are rejected outright —
 * `timingSafeEqual` throws rather than returning false when lengths differ.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 });

  const auth = request.headers.get('authorization') ?? '';
  if (!safeEqual(auth, `Bearer ${secret}`))
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { tags: rawTags, paths: rawPaths } = body as { tags?: unknown; paths?: unknown };
  const tags = Array.isArray(rawTags)
    ? rawTags.filter((t): t is string => typeof t === 'string' && TAG.test(t))
    : [];
  const paths = Array.isArray(rawPaths)
    ? rawPaths.filter(
        (p): p is string => typeof p === 'string' && PATH.test(p) && !p.includes('..'),
      )
    : [];

  for (const tag of tags) revalidateTag(tag, 'max');
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ revalidated: { tags, paths } });
}
