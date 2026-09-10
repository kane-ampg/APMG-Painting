import { describe, expect, it } from 'vitest';
import { describeRequest } from '@/lib/enquiry/transport';
import type { Enquiry } from '@/lib/validation/enquiry';

/**
 * The email subject is how Farbod, Zac and Simon triage an inbox: it has to
 * say what was booked and where before anyone opens the message.
 */
const request: Enquiry = {
  formType: 'commercial',
  siteRegion: 'melbourne',
  assessmentType: 'onsite',
  propertyType: 'office',
  siteAddress: '1 Turbo Drive, Bayswater North VIC 3153',
  preferredTimes: 'Monday morning.',
  notes: '',
  organisation: 'Example Pty Ltd',
  name: 'Alex Chen',
  phone: '0400 000 000',
  email: 'alex@example.com',
  renderedAt: 0,
  company_website: '',
};

describe('describeRequest', () => {
  it('names the assessment type and the contact in the subject', () => {
    expect(describeRequest(request).subject).toBe(
      'Site assessment request — On-site visit — Alex Chen, Example Pty Ltd',
    );
  });

  it('carries no representative line — assignment is internal', () => {
    expect(describeRequest(request).body).not.toMatch(/Representative/);
  });

  it('reads the labels a visitor saw, not the enum values', () => {
    const { body } = describeRequest({ ...request, assessmentType: 'online' });
    expect(body).toMatch(/Assessment type: Online assessment/);
    expect(body).toMatch(/Site region: Metropolitan Melbourne/);
    expect(body).not.toMatch(/\bonsite\b|\bonline\b(?! assessment)/);
  });

  it('never carries the anti-spam fields into the email', () => {
    const { body } = describeRequest(request);
    expect(body).not.toMatch(/company_website|renderedAt|formType/);
  });
});
