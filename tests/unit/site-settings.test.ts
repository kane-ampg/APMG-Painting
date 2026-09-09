import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  contactPageSchema,
  siteSettingsSchema,
  isSingleton,
  singletonSlug,
} from '@/lib/content/schemas';
import { defaultSiteSettings, addressNote, formatAddress, phoneHref } from '@/lib/site';

describe('site settings', () => {
  it('accepts the current hard-coded facts as the seed', () => {
    const result = siteSettingsSchema.safeParse(defaultSiteSettings);
    expect(result.success, JSON.stringify(result)).toBe(true);
  });

  it('derives the tel link from the display number', () => {
    expect(phoneHref('1300 97 97 40')).toBe('tel:1300979740');
    expect(phoneHref('(03) 9876 5432')).toBe('tel:0398765432');
  });

  it('rejects a phone number that is not Australian', () => {
    const bad = { ...defaultSiteSettings, phone: '+1 555 123 4567' };
    expect(siteSettingsSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts a 1300 or 1800 number printed in three-digit groups', () => {
    // APMG's own number is grouped in twos, but "1300 123 456" is the
    // conventional printing and an editor typing it must not be rejected.
    for (const phone of [
      '1300 123 456',
      '1800 123 456',
      '1300123456',
      '1300 97 97 40',
      '(03) 9876 5432',
      '0412 345 678',
      '13 12 34',
    ]) {
      expect(siteSettingsSchema.safeParse({ ...defaultSiteSettings, phone }).success, phone).toBe(
        true,
      );
    }
    // '1300 12' is deliberately absent: it is a valid six-digit 13 number
    // ("13 00 12"), which the 13xxxx alternative admits on purpose.
    for (const phone of ['+1 555 123 4567', '1300 123 4567', '1900 123 456', 'call us']) {
      expect(siteSettingsSchema.safeParse({ ...defaultSiteSettings, phone }).success, phone).toBe(
        false,
      );
    }
  });

  it('rejects an ABN that is not eleven digits', () => {
    expect(siteSettingsSchema.safeParse({ ...defaultSiteSettings, abn: '1234' }).success).toBe(
      false,
    );
    expect(
      siteSettingsSchema.safeParse({ ...defaultSiteSettings, abn: '12 345 678 901' }).success,
    ).toBe(true);
    expect(siteSettingsSchema.safeParse({ ...defaultSiteSettings, abn: null }).success).toBe(true);
  });

  it('formats the address on one line', () => {
    expect(formatAddress(defaultSiteSettings.address)).toBe(
      '1 Turbo Drive, Bayswater North VIC 3153',
    );
  });

  it('shows the move note before the effective date and drops it after', () => {
    const settings = {
      ...defaultSiteSettings,
      address: { ...defaultSiteSettings.address, effectiveFrom: '2026-10-01' },
      previousAddress: 'Factory 15/30 Ramset Dr, Chirnside Park VIC 3116',
    };
    expect(addressNote(settings, new Date('2026-09-15'))).toMatch(/from October 2026/);
    expect(addressNote(settings, new Date('2026-10-02'))).toBeNull();
  });

  it('knows which collections are singletons', () => {
    expect(isSingleton('settings')).toBe(true);
    expect(isSingleton('pages')).toBe(true);
    expect(isSingleton('projects')).toBe(false);
    expect(singletonSlug.settings).toBe('site');
    expect(singletonSlug.pages).toBe('contact-us');
  });

  it('contact page copy keeps the meta description under 160', () => {
    const copy = {
      slug: 'contact-us',
      title: 'Contact us',
      lede: 'Tell us about the site.',
      formHeading: 'Request a site assessment',
      formIntro: 'For schools, clinics and offices.',
      metaTitle: 'Contact APMG Painting | Melbourne Painters',
      metaDescription: 'x'.repeat(161),
    };
    expect(contactPageSchema.safeParse(copy).success).toBe(false);
    expect(contactPageSchema.safeParse({ ...copy, metaDescription: 'Fine.' }).success).toBe(true);
  });
});

describe('getSiteSettings fallback', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns the defaults when there is no database', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const { getSiteSettings, getPage } = await import('@/lib/content/source');
    expect((await getSiteSettings()).phone).toBe('1300 97 97 40');
    expect((await getPage('contact-us')).title).toBe('Contact us');
  });
});
