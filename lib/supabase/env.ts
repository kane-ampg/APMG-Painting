/**
 * Supabase configuration.
 *
 * Absence is a supported state: unit tests, the sandbox preview and a fresh
 * clone all run without a database and fall back to the TypeScript content
 * files. Presence is checked once here so no call site reads process.env.
 *
 * No `server-only` import and no Next.js import here — next.config.ts reads
 * `supabaseHostname()` for remotePatterns, and Next config modules cannot
 * import `server-only` or `next/*`.
 */
export function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  return { url, anonKey };
}

/**
 * Storage host, used by next.config remotePatterns and lib/media/url.ts.
 *
 * A malformed URL returns null rather than throwing: this is read at the top
 * of next.config.ts, where a typo'd env var would otherwise take down every
 * command in the repo — `next dev`, `next build` and `next lint` alike — with
 * a stack trace that names the URL parser rather than the setting.
 */
export function supabaseHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL is not a valid URL; ignoring it');
    return null;
  }
}
