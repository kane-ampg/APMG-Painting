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

  it('asks for enough tokens that thinking cannot eat the whole budget', async () => {
    // Opus 5 thinks by default and thinking is billed against `max_tokens`.
    // Below a few thousand, a task that reasons at all returns no structured
    // output and the editor sees a bug that is not there.
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync('lib/ai/claude.ts', 'utf8'),
    );
    for (const budget of source.matchAll(/max_tokens:\s*(\w+)/g)) {
      expect(budget[1]).toBe('MAX_TOKENS');
    }
    expect(source).toMatch(/const MAX_TOKENS = 8000;/);
  });
});

describe('refusals', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@anthropic-ai/sdk');
  });

  /**
   * A policy refusal is an HTTP 200 with `stop_reason: 'refusal'` and no
   * output. Read blindly, that looks identical to a malformed response, and
   * the editor gets told the model "returned no structured output" — which
   * points at the form rather than at the request.
   */
  it('says the model declined, rather than blaming the output shape', async () => {
    const parse = vi.fn(async () => ({ stop_reason: 'refusal', parsed_output: null }));
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class {
        beta = { messages: { parse } };
      },
    }));
    const { draftPostSummary, describeImage, summariseProject } = await import('@/lib/ai/claude');

    await expect(draftPostSummary({ title: 'T', body: 'B' })).rejects.toThrow(/declined/i);
    await expect(describeImage('https://x/y.webp')).rejects.toThrow(/declined/i);
    await expect(
      summariseProject({
        slug: 'a',
        title: 'T',
        clientOrPropertyType: 'Office',
        location: 'Melbourne',
        sectorSlug: 'commercial-offices',
        challenge: 'c',
        scopeOfWork: [],
        images: [],
        outcome: [],
        relatedServiceSlugs: [],
        relatedLocationSlugs: [],
        isFeatured: false,
      }),
    ).rejects.toThrow(/declined/i);
  });
});
