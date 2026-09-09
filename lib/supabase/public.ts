import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseEnv } from './env';

/**
 * Session-less Supabase client for the cached, public read path.
 *
 * `createServerSupabase()` awaits `cookies()`, and Next 16 throws E846 for any
 * dynamic API used inside a cache scope — so the client that
 * `unstable_cache` wraps cannot be the per-request one. Published rows are
 * world-readable under RLS, so the anon key alone is enough here and no
 * session is wanted: a cached value must not vary by visitor.
 *
 * Memoised per process. `persistSession: false` keeps the client from
 * reaching for storage it has no business touching on the server.
 */
let client: SupabaseClient | null = null;

export function createPublicSupabase(): SupabaseClient {
  if (client) return client;
  const { url, anonKey } = supabaseEnv();
  client = createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}
