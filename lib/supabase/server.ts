import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseEnv } from './env';

/**
 * Per-request Supabase client for Server Components and Server Actions.
 * Carries the user's session cookie, so row level security applies. The
 * anon key is all it ever holds; write access comes from the session.
 */
export async function createServerSupabase() {
  const { url, anonKey } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // proxy.ts refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
