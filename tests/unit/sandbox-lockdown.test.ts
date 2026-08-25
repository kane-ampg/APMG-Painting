import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The four sandbox noindex layers must switch together.
 *
 * Layer 4 — the X-Robots-Tag response header — was unconditional. It is the
 * only layer that covers non-HTML responses, and it is also the only layer
 * whose failure is invisible: at go-live, releasing layers 1-3 while this one
 * kept returning noindex would launch the site permanently unindexable with
 * nothing wrong on the page itself. These tests assert all four move as one.
 */

type HeaderEntry = { source: string; headers: { key: string; value: string }[] };

async function robotsHeaders(sandbox: string | undefined): Promise<HeaderEntry[]> {
  vi.resetModules();
  if (sandbox === undefined) {
    delete process.env.NEXT_PUBLIC_SANDBOX;
  } else {
    process.env.NEXT_PUBLIC_SANDBOX = sandbox;
  }

  const config = (await import('../../next.config')).default;
  const headers = (await config.headers?.()) ?? [];
  return (headers as HeaderEntry[]).filter((entry) =>
    entry.headers.some((h) => h.key === 'X-Robots-Tag'),
  );
}

const original = process.env.NEXT_PUBLIC_SANDBOX;

afterEach(() => {
  if (original === undefined) {
    delete process.env.NEXT_PUBLIC_SANDBOX;
  } else {
    process.env.NEXT_PUBLIC_SANDBOX = original;
  }
  vi.resetModules();
});

describe('X-Robots-Tag is conditional on the sandbox flag', () => {
  it('is present when NEXT_PUBLIC_SANDBOX is unset', async () => {
    const entries = await robotsHeaders(undefined);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.headers[0]?.value).toBe('noindex, nofollow');
  });

  it('is present when NEXT_PUBLIC_SANDBOX is any value other than "false"', async () => {
    const entries = await robotsHeaders('true');
    expect(entries).toHaveLength(1);
  });

  it('is ABSENT when NEXT_PUBLIC_SANDBOX is exactly "false"', async () => {
    const entries = await robotsHeaders('false');
    expect(entries).toHaveLength(0);
  });
});

describe('the config predicate agrees with lib/site.ts', () => {
  it.each([
    [undefined, true],
    ['true', true],
    ['false', false],
  ])('NEXT_PUBLIC_SANDBOX=%s -> isSandbox %s', async (value, expected) => {
    vi.resetModules();
    if (value === undefined) {
      delete process.env.NEXT_PUBLIC_SANDBOX;
    } else {
      process.env.NEXT_PUBLIC_SANDBOX = value;
    }

    const { isSandbox } = await import('../../lib/site');
    expect(isSandbox).toBe(expected);

    const entries = await robotsHeaders(value);
    expect(entries.length > 0).toBe(expected);
  });
});
