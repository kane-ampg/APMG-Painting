import { afterEach, describe, expect, it, vi } from 'vitest';

describe('ai helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('reports AI as unavailable without a key', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const { hasAi } = await import('@/lib/ai/claude');
    expect(hasAi()).toBe(false);
  });

  it('house rules forbid invented claims and residential work', async () => {
    const { HOUSE_RULES } = await import('@/lib/ai/claude');
    expect(HOUSE_RULES).toMatch(/commercial/i);
    expect(HOUSE_RULES).toMatch(/do not invent|never invent/i);
    expect(HOUSE_RULES).toMatch(/Australian English/);
    expect(HOUSE_RULES).toContain('APMG Painting');
  });

  it('clamps meta description to 160 characters even if the model runs long', async () => {
    const { clampMeta } = await import('@/lib/ai/claude');
    const long = 'A'.repeat(200);
    expect(clampMeta(long).length).toBeLessThanOrEqual(160);
    expect(clampMeta('Short.')).toBe('Short.');
  });
});
