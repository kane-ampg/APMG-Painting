import { beforeEach, describe, expect, it } from 'vitest';
import { checkRateLimit, resetRateLimits } from '@/lib/enquiry/rate-limit';

describe('rate limiting', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('allows the first five submissions in a window', () => {
    for (let i = 0; i < 5; i += 1) {
      expect(checkRateLimit('1.2.3.4').allowed, `attempt ${i + 1}`).toBe(true);
    }
  });

  it('blocks the sixth', () => {
    for (let i = 0; i < 5; i += 1) checkRateLimit('1.2.3.4');
    const result = checkRateLimit('1.2.3.4');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('keeps separate counts per client', () => {
    for (let i = 0; i < 5; i += 1) checkRateLimit('1.2.3.4');
    expect(checkRateLimit('5.6.7.8').allowed).toBe(true);
  });

  it('resets once the window has passed', () => {
    const start = 1_000_000;
    for (let i = 0; i < 5; i += 1) checkRateLimit('1.2.3.4', start);
    expect(checkRateLimit('1.2.3.4', start).allowed).toBe(false);

    const afterWindow = start + 10 * 60 * 1000 + 1;
    expect(checkRateLimit('1.2.3.4', afterWindow).allowed).toBe(true);
  });
});
