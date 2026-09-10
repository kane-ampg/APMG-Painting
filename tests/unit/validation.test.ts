import { describe, expect, it } from 'vitest';
import { siteAssessmentFields, siteAssessmentSchema } from '@/lib/validation/enquiry';

/**
 * The free site assessment booking.
 *
 * On-site visits are offered in metropolitan Melbourne only; everywhere else
 * gets an online scoping call. The schema is where that rule is enforced, so
 * neither the form nor the chat can be talked around it.
 */
const validOnsite = {
  formType: 'commercial',
  siteRegion: 'melbourne',
  assessmentType: 'onsite',
  propertyType: 'education-and-childcare',
  siteAddress: '12 Canterbury Road, Vermont VIC 3133',
  preferredTimes: 'Tuesday or Wednesday morning next week.',
  notes: 'Ask for the facilities office at the front gate.',
  organisation: 'Vermont Secondary College',
  name: 'Alex Chen',
  phone: '(03) 9000 0000',
  email: 'facilities@example.edu.au',
  renderedAt: 1700000000000,
  company_website: '',
};

const validOnline = {
  ...validOnsite,
  siteRegion: 'interstate',
  assessmentType: 'online',
  siteAddress: 'Fortitude Valley QLD',
};

describe('site assessment schema', () => {
  it('accepts an on-site assessment in Melbourne', () => {
    expect(siteAssessmentSchema.safeParse(validOnsite).success).toBe(true);
  });

  it('accepts an online assessment anywhere', () => {
    expect(siteAssessmentSchema.safeParse(validOnline).success).toBe(true);
    expect(
      siteAssessmentSchema.safeParse({ ...validOnline, siteRegion: 'regional-victoria' }).success,
    ).toBe(true);
  });

  it('refuses an on-site assessment outside Melbourne, and says why on that field', () => {
    const result = siteAssessmentSchema.safeParse({
      ...validOnsite,
      siteRegion: 'regional-victoria',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.assessmentType?.[0]).toMatch(/melbourne/i);
    }
  });

  it('rejects a region outside the known list', () => {
    const result = siteAssessmentSchema.safeParse({ ...validOnline, siteRegion: 'mars' });
    expect(result.success).toBe(false);
  });

  it('requires a site address, so the team knows where the site is', () => {
    const result = siteAssessmentSchema.safeParse({ ...validOnline, siteAddress: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.siteAddress).toBeDefined();
    }
  });

  it('requires preferred times, because the booking is confirmed by email', () => {
    const { preferredTimes: _omitted, ...rest } = validOnline;
    const result = siteAssessmentSchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.preferredTimes).toBeDefined();
    }
  });

  it('does not ask the visitor to pick a representative — APMG assigns one', () => {
    expect('assessor' in siteAssessmentFields.shape).toBe(false);
    expect(siteAssessmentSchema.safeParse({ ...validOnline, assessor: 'zac' }).success).toBe(true);
  });

  it('treats notes as optional', () => {
    const { notes: _omitted, ...rest } = validOnline;
    expect(siteAssessmentSchema.safeParse(rest).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    const result = siteAssessmentSchema.safeParse({ ...validOnsite, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toMatch(/valid email/i);
    }
  });

  it('rejects a phone number containing letters', () => {
    const result = siteAssessmentSchema.safeParse({ ...validOnsite, phone: 'call me' });
    expect(result.success).toBe(false);
  });

  it('rejects a filled honeypot', () => {
    const result = siteAssessmentSchema.safeParse({
      ...validOnsite,
      company_website: 'http://spam.example',
    });
    expect(result.success).toBe(false);
  });

  it('requires an organisation — the field the live generic form never asked for', () => {
    const { organisation: _omitted, ...rest } = validOnsite;
    const result = siteAssessmentSchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.organisation).toBeDefined();
    }
  });

  it('rejects a sector outside the known list', () => {
    const result = siteAssessmentSchema.safeParse({
      ...validOnsite,
      propertyType: 'nuclear-reactor',
    });
    expect(result.success).toBe(false);
  });

  it('exposes the field shape separately, so the chat can validate one answer at a time', () => {
    expect(Object.keys(siteAssessmentFields.shape)).toContain('assessmentType');
  });
});
