import 'server-only';
import { isEditor } from '@/lib/app-role';

export type RevalidatePayload = { tags: string[]; paths: string[] };

/**
 * From the editor deployment, tell the public site what changed. On the
 * public site itself this is a no-op because updateTag already ran locally.
 * Never throws: a failed refresh is reported to the editor, not hidden.
 */
export async function notifyPublicSite(
  payload: RevalidatePayload,
): Promise<{ ok: boolean; message?: string }> {
  if (!isEditor()) return { ok: true };

  const origin = process.env.PUBLIC_SITE_ORIGIN;
  const secret = process.env.REVALIDATE_SECRET;
  if (!origin || !secret) {
    return {
      ok: false,
      message:
        'Saved, but the live site did not refresh: PUBLIC_SITE_ORIGIN or REVALIDATE_SECRET is not set on the editor.',
    };
  }

  try {
    const res = await fetch(`${origin}/api/revalidate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (!res.ok)
      return {
        ok: false,
        message: `Saved, but the live site did not refresh (HTTP ${res.status}). Try Publish again.`,
      };
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: 'Saved, but the live site did not refresh (network error). Try Publish again.',
    };
  }
}
