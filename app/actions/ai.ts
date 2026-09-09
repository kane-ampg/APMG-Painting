'use server';

import { requireAdmin } from '@/lib/auth/admin';
import { describeImage, draftPostSummary, hasAi, summariseProject } from '@/lib/ai/claude';
import { projectSchema } from '@/lib/content/schemas';
import { supabaseHostname } from '@/lib/supabase/env';

export type AiResult<T> = { ok: true; data: T } | { ok: false; message: string };

function unavailable<T>(): AiResult<T> {
  return { ok: false, message: 'AI assist is not configured on this deployment.' };
}

export async function aiPostSummary(input: { title: string; body: string }) {
  await requireAdmin();
  if (!hasAi()) return unavailable<Awaited<ReturnType<typeof draftPostSummary>>>();
  if (input.body.trim().length < 200)
    return { ok: false as const, message: 'Write at least a couple of paragraphs first.' };
  try {
    return { ok: true as const, data: await draftPostSummary(input) };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : 'AI request failed.',
    };
  }
}

/**
 * Only this project's media bucket. The URL is handed to the model as a
 * remote image to fetch, so an unchecked value here is a request the server
 * makes on a stranger's behalf. Matching `supabaseHostname()` rather than a
 * `*.supabase.co` pattern means somebody else's Supabase project does not
 * qualify, and a self-hosted or custom-domain Supabase still does.
 */
function isLibraryImage(imageUrl: string): boolean {
  const host = supabaseHostname();
  if (!host) return false;
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return false;
  }
  return (
    parsed.protocol === 'https:' &&
    parsed.host === host &&
    parsed.pathname.startsWith('/storage/v1/object/public/media/')
  );
}

export async function aiDescribeImage(imageUrl: string) {
  await requireAdmin();
  if (!hasAi()) return unavailable<Awaited<ReturnType<typeof describeImage>>>();
  if (!isLibraryImage(imageUrl)) {
    return { ok: false as const, message: 'Only images in the media library can be described.' };
  }
  try {
    return { ok: true as const, data: await describeImage(imageUrl) };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : 'AI request failed.',
    };
  }
}

export async function aiProjectSummary(raw: unknown) {
  await requireAdmin();
  if (!hasAi()) return unavailable<Awaited<ReturnType<typeof summariseProject>>>();
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false as const, message: 'Fill in the challenge, scope and outcome first.' };
  try {
    return { ok: true as const, data: await summariseProject(parsed.data) };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : 'AI request failed.',
    };
  }
}
