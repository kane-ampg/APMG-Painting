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

/** Storage host, used by next.config remotePatterns and lib/media/url.ts. */
export function supabaseHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? new URL(url).hostname : null;
}
