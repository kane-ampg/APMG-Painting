import { afterEach, describe, expect, it, vi } from 'vitest';

describe('appRole', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('defaults to site', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', '');
    const { appRole, isEditor } = await import('@/lib/app-role');
    expect(appRole()).toBe('site');
    expect(isEditor()).toBe(false);
  });

  it('is editor only when told so exactly', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', 'editor');
    const { appRole } = await import('@/lib/app-role');
    expect(appRole()).toBe('editor');
  });

  it('treats any other value as site', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', 'admin');
    const { appRole } = await import('@/lib/app-role');
    expect(appRole()).toBe('site');
  });
});
