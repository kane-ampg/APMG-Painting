import { afterEach, describe, expect, it, vi } from 'vitest';

describe('supabase env', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('reports no Supabase when the URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const { hasSupabase } = await import('@/lib/supabase/env');
    expect(hasSupabase()).toBe(false);
  });

  it('returns url and anon key when both are set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    const { hasSupabase, supabaseEnv } = await import('@/lib/supabase/env');
    expect(hasSupabase()).toBe(true);
    expect(supabaseEnv()).toEqual({ url: 'https://abc.supabase.co', anonKey: 'anon' });
  });

  it('throws a readable error when asked for env that is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const { supabaseEnv } = await import('@/lib/supabase/env');
    expect(() => supabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('reads the storage hostname out of the URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    const { supabaseHostname } = await import('@/lib/supabase/env');
    expect(supabaseHostname()).toBe('abc.supabase.co');
  });

  it('returns null for a malformed URL rather than throwing', async () => {
    // next.config.ts calls this at module scope. A typo'd env var must not
    // take down `next dev`, `next build` and `next lint` with a URL parser
    // stack trace.
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'abc.supabase.co');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { supabaseHostname } = await import('@/lib/supabase/env');
    expect(supabaseHostname()).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
