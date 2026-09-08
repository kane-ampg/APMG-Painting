'use client';
import { createBrowserClient } from '@supabase/ssr';
import { supabaseEnv } from './env';

/** Browser-side Supabase client for the admin UI's client components. */
export function createBrowserSupabase() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient(url, anonKey);
}
