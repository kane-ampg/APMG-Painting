import { afterEach, describe, expect, it, vi } from 'vitest';

const redirect = vi.fn((to: string) => {
  throw new Error(`REDIRECT:${to}`);
});
vi.mock('next/navigation', () => ({ redirect: (to: string) => redirect(to) }));

function mockSupabase(user: { email: string } | null, allowlisted: boolean) {
  vi.doMock('@/lib/supabase/server', () => ({
    createServerSupabase: async () => ({
      auth: { getUser: async () => ({ data: { user }, error: null }) },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: allowlisted ? { email: user?.email } : null }),
          }),
        }),
      }),
    }),
  }));
}

describe('requireAdmin', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/lib/supabase/server');
    redirect.mockClear();
  });

  it('redirects to login when signed out', async () => {
    mockSupabase(null, false);
    const { requireAdmin } = await import('@/lib/auth/admin');
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/admin/login/');
  });

  it('forbids a signed-in user who is not on the allowlist', async () => {
    mockSupabase({ email: 'someone@example.com' }, false);
    const { requireAdmin, AdminForbiddenError } = await import('@/lib/auth/admin');
    await expect(requireAdmin()).rejects.toBeInstanceOf(AdminForbiddenError);
  });

  it('returns the email for an allowlisted user', async () => {
    mockSupabase({ email: 'kaner@simple.biz' }, true);
    const { requireAdmin } = await import('@/lib/auth/admin');
    await expect(requireAdmin()).resolves.toEqual({ email: 'kaner@simple.biz' });
  });
});
