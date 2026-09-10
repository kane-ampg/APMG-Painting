import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultSiteSettings } from '@/lib/site';

/**
 * The enquiry action's two failure messages.
 *
 * Both name a phone number, and both used to name a literal one. FormStatus
 * renders whatever the action returns, so a hard-coded number there survives
 * every settings change an editor makes — a rate-limited visitor would be sent
 * to the old line. `@/lib/content/source` is the seam these mock, so the tests
 * assert the action *reads* the number rather than that it happens to match.
 */
const { settings } = vi.hoisted(() => ({
  settings: {
    current: null as unknown as { phone: string },
    /** Set to make the settings read throw, as a Supabase blip would. */
    fails: false,
  },
}));
vi.mock('@/lib/content/source', () => ({
  getSiteSettings: async () => {
    if (settings.fails) throw new Error('supabase unavailable');
    return settings.current;
  },
}));

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': '1.2.3.4' }),
}));

const { allowed } = vi.hoisted(() => ({ allowed: { current: true } }));
vi.mock('@/lib/enquiry/rate-limit', () => ({
  checkRateLimit: () => ({ allowed: allowed.current, remaining: 0, retryAfterSeconds: 600 }),
}));

const { transportResult } = vi.hoisted(() => ({
  transportResult: { current: { delivered: true } as Record<string, unknown> },
}));
vi.mock('@/lib/enquiry/transport', () => ({
  getEnquiryTransport: () => ({ id: 'test', send: async () => transportResult.current }),
}));

/** A submission that passes validation and the anti-bot timing floor. */
function validForm(): FormData {
  const fd = new FormData();
  const fields: Record<string, string> = {
    formType: 'commercial',
    siteRegion: 'melbourne',
    assessmentType: 'onsite',
    propertyType: 'education-and-childcare',
    siteAddress: '12 Canterbury Road, Vermont VIC 3133',
    preferredTimes: 'Tuesday or Wednesday morning.',
    notes: 'Term breaks only.',
    organisation: 'Vermont Secondary College',
    name: 'Alex Chen',
    phone: '(03) 9000 0000',
    email: 'facilities@example.edu.au',
    renderedAt: String(Date.now() - 60_000),
    company_website: '',
  };
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe('submitEnquiry failure messages', () => {
  afterEach(() => {
    allowed.current = true;
    settings.fails = false;
    transportResult.current = { delivered: true };
    vi.resetModules();
  });

  it('tells a rate-limited visitor to call the number from settings', async () => {
    settings.current = defaultSiteSettings;
    allowed.current = false;
    const { submitEnquiry } = await import('@/app/actions/enquiry');

    const result = await submitEnquiry({ status: 'idle' }, validForm());

    expect(result.status).toBe('error');
    expect(result.message).toContain('Too many enquiries');
    expect(result.message).toContain(defaultSiteSettings.phone);
  });

  it('names the settings number when the provider fails', async () => {
    settings.current = defaultSiteSettings;
    transportResult.current = { delivered: false, reason: 'provider-error' };
    const { submitEnquiry } = await import('@/app/actions/enquiry');

    const result = await submitEnquiry({ status: 'idle' }, validForm());

    expect(result.status).toBe('error');
    expect(result.message).toContain(defaultSiteSettings.phone);
  });

  it('follows the settings, so an edited number reaches both messages', async () => {
    // The strong form: the old literal would still pass the two tests above
    // on a stock database. It cannot pass this one.
    settings.current = { ...defaultSiteSettings, phone: '1300 00 00 00' };
    const { submitEnquiry } = await import('@/app/actions/enquiry');

    allowed.current = false;
    const limited = await submitEnquiry({ status: 'idle' }, validForm());
    expect(limited.message).toContain('1300 00 00 00');
    expect(limited.message).not.toContain(defaultSiteSettings.phone);

    allowed.current = true;
    transportResult.current = { delivered: false, reason: 'provider-error' };
    const failed = await submitEnquiry({ status: 'idle' }, validForm());
    expect(failed.message).toContain('1300 00 00 00');
    expect(failed.message).not.toContain(defaultSiteSettings.phone);
  });

  it('confirms the booking, not a quote, when the request is delivered', async () => {
    settings.current = defaultSiteSettings;
    const { submitEnquiry } = await import('@/app/actions/enquiry');

    const result = await submitEnquiry({ status: 'idle' }, validForm());

    expect(result.status).toBe('success');
    expect(result.message).toMatch(/site assessment request is with us/i);
    expect(result.message).toMatch(/confirm a time by email/i);
  });

  it('refuses an on-site visit outside Melbourne with a field error, not a crash', async () => {
    settings.current = defaultSiteSettings;
    const { submitEnquiry } = await import('@/app/actions/enquiry');

    const fd = validForm();
    fd.set('siteRegion', 'interstate');
    const result = await submitEnquiry({ status: 'idle' }, fd);

    expect(result.status).toBe('error');
    expect(result.errors?.assessmentType?.[0]).toMatch(/melbourne/i);
  });

  it('still reports a delivered submission as success', async () => {
    settings.current = defaultSiteSettings;
    const { submitEnquiry } = await import('@/app/actions/enquiry');

    const result = await submitEnquiry({ status: 'idle' }, validForm());

    expect(result.status).toBe('success');
    expect(result.delivered).toBe(true);
  });

  it('does not cost a visitor their enquiry when the settings read fails', async () => {
    // The settings read is a database round trip. If it were awaited up front
    // — or awaited at all on the happy path — a transient Supabase error would
    // turn a perfectly good enquiry into a failure. It is read only inside the
    // two branches that need a phone number, and this asserts that.
    settings.current = defaultSiteSettings;
    settings.fails = true;
    const { submitEnquiry } = await import('@/app/actions/enquiry');

    const result = await submitEnquiry({ status: 'idle' }, validForm());

    expect(result.status).toBe('success');
    expect(result.delivered).toBe(true);
  });
});
