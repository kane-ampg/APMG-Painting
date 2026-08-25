import { describe, expect, it } from 'vitest';
import { commercialEnquirySchema } from '@/lib/validation/enquiry';

const validCommercial = {
  formType: 'commercial',
  name: 'Alex Chen',
  organisation: 'Vermont Secondary College',
  phone: '(03) 9000 0000',
  email: 'facilities@example.edu.au',
  propertyType: 'education-and-childcare',
  projectLocation: 'Vermont',
  scopeSummary: 'Internal common areas plus two external elevations.',
  timeframe: 'planning',
  operatingHoursConstraints: 'Term breaks only.',
  siteAssessmentRequested: 'true',
  renderedAt: 1700000000000,
  company_website: '',
};

describe('commercial enquiry schema', () => {
  it('accepts a complete submission', () => {
    expect(commercialEnquirySchema.safeParse(validCommercial).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    const result = commercialEnquirySchema.safeParse({
      ...validCommercial,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toMatch(/valid email/i);
    }
  });

  it('rejects a phone number containing letters', () => {
    const result = commercialEnquirySchema.safeParse({
      ...validCommercial,
      phone: 'call me',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a filled honeypot', () => {
    const result = commercialEnquirySchema.safeParse({
      ...validCommercial,
      company_website: 'http://spam.example',
    });
    expect(result.success).toBe(false);
  });

  it('requires an organisation — the field the live generic form never asked for', () => {
    const { organisation: _omitted, ...withoutOrganisation } = validCommercial;
    const result = commercialEnquirySchema.safeParse(withoutOrganisation);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.organisation).toBeDefined();
    }
  });

  it('treats operating-hours constraints as optional', () => {
    const { operatingHoursConstraints: _omitted, ...rest } = validCommercial;
    expect(commercialEnquirySchema.safeParse(rest).success).toBe(true);
  });

  it('coerces the site-assessment checkbox to a boolean', () => {
    const result = commercialEnquirySchema.safeParse(validCommercial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.siteAssessmentRequested).toBe(true);
    }
  });

  it('rejects a sector outside the known list', () => {
    const result = commercialEnquirySchema.safeParse({
      ...validCommercial,
      propertyType: 'nuclear-reactor',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a scope summary that is too short to be useful', () => {
    const result = commercialEnquirySchema.safeParse({ ...validCommercial, scopeSummary: 'hi' });
    expect(result.success).toBe(false);
  });
});
