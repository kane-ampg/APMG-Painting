import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  contactPageSchema,
  siteSettingsSchema,
  isSingleton,
  singletonSlug,
} from '@/lib/content/schemas';
import {
  addressEffectiveMonth,
  defaultSiteSettings,
  formatAddress,
  internationalPhone,
  phoneHref,
} from '@/lib/site';

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

  it('names a future address month until the move date, then drops it', () => {
    // Nothing to describe today — the seed carries no move date — but the
    // footer's line has to expire on its own once an editor sets one.
    expect(addressEffectiveMonth(defaultSiteSettings)).toBeNull();

    const moving = {
      ...defaultSiteSettings,
      address: { ...defaultSiteSettings.address, effectiveFrom: '2026-10-01' },
    };
    expect(addressEffectiveMonth(moving, new Date('2026-09-15'))).toBe('October 2026');
    expect(addressEffectiveMonth(moving, new Date('2026-10-02'))).toBeNull();
  });

  it('country-codes the display number without mangling any Australian shape', () => {
    // Every one of these is a number `auPhone` accepts, so the formatter has
    // to read back whatever the form lets an editor save. The two failures
    // this covers were a six-digit 13 number sliced as a landline, and an
    // already-country-coded number having its 61 grouped as subscriber
    // digits ("+61 3 9123 4567" -> "+61 6 1391 234567").
    const cases: [string, string][] = [
      ['1300 97 97 40', '+61 1300 979 740'],
      ['1300 123 456', '+61 1300 123 456'],
      ['1800 123 456', '+61 1800 123 456'],
      ['13 26 84', '+61 13 26 84'],
      ['0412 345 678', '+61 412 345 678'],
      ['03 9876 5432', '+61 3 9876 5432'],
      ['(03) 9876 5432', '+61 3 9876 5432'],
      ['+61 3 9123 4567', '+61 3 9123 4567'],
      ['61 412 345 678', '+61 412 345 678'],
    ];

    for (const [display, expected] of cases) {
      expect(internationalPhone(display), display).toBe(expected);
      // The form must accept everything the formatter claims to handle.
      expect(
        siteSettingsSchema.safeParse({ ...defaultSiteSettings, phone: display }).success,
        display,
      ).toBe(true);
    }
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
