import { describe, expect, it } from 'vitest';
import {
  commercialEnquirySchema,
  residentialEnquirySchema,
} from '@/lib/validation/enquiry';

const validResidential = {
  formType: 'residential',
  name: 'Jo Smith',
  phone: '0400 000 000',
  email: 'jo@example.com',
  suburb: 'Camberwell',
  propertyType: 'house',
  workType: 'both',
  timeframe: '1-3-months',
  description: 'Weatherboard exterior, some peeling on the north face.',
  renderedAt: 1700000000000,
  company_website: '',
};

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

describe('residential enquiry schema', () => {
  it('accepts a complete submission', () => {
    expect(residentialEnquirySchema.safeParse(validResidential).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    const result = residentialEnquirySchema.safeParse({
      ...validResidential,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toMatch(/valid email/i);
    }
  });

  it('rejects a phone number containing letters', () => {
    const result = residentialEnquirySchema.safeParse({
      ...validResidential,
      phone: 'call me',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a filled honeypot', () => {
    const result = residentialEnquirySchema.safeParse({
      ...validResidential,
      company_website: 'http://spam.example',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a description that is too short to be useful', () => {
    const result = residentialEnquirySchema.safeParse({ ...validResidential, description: 'hi' });
    expect(result.success).toBe(false);
  });
});

describe('commercial enquiry schema', () => {
  it('accepts a complete submission', () => {
    expect(commercialEnquirySchema.safeParse(validCommercial).success).toBe(true);
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
});
