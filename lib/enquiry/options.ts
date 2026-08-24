/**
 * Canonical choice labels for the enquiry enums.
 *
 * Two surfaces now ask the same questions — the full forms on the contact page
 * and the floating quote chat — and a third (the eventual CRM mapping) will
 * read the same values. The values must match `lib/validation/enquiry.ts`
 * exactly or the server rejects the submission, and the labels must match each
 * other or the same question reads differently depending on where a visitor
 * happens to answer it. Both live here, once.
 *
 * `tests/unit/chat-flow.test.ts` asserts these value lists are exactly the Zod
 * enum members, so adding a schema value without a label fails the build.
 */

export type EnquiryOption = { value: string; label: string };

export const RESIDENTIAL_PROPERTY_TYPES: readonly EnquiryOption[] = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'other', label: 'Something else' },
] as const;

export const RESIDENTIAL_WORK_TYPES: readonly EnquiryOption[] = [
  { value: 'interior', label: 'Interior' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'both', label: 'Both' },
] as const;

export const RESIDENTIAL_TIMEFRAMES: readonly EnquiryOption[] = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '1-3-months', label: 'Within 1–3 months' },
  { value: '3-plus-months', label: 'More than 3 months away' },
  { value: 'planning', label: 'Still planning' },
] as const;

export const COMMERCIAL_PROPERTY_TYPES: readonly EnquiryOption[] = [
  { value: 'education-and-childcare', label: 'School or childcare' },
  { value: 'healthcare', label: 'Healthcare or medical' },
  { value: 'aged-care-and-retirement', label: 'Aged care or retirement living' },
  { value: 'body-corporate-and-strata', label: 'Body corporate or strata' },
  { value: 'retail', label: 'Retail' },
  { value: 'hospitality', label: 'Hospitality or venue' },
  { value: 'leisure-and-sports', label: 'Leisure or sports facility' },
  { value: 'industrial', label: 'Industrial or warehouse' },
  { value: 'office', label: 'Office' },
  { value: 'other', label: 'Something else' },
] as const;

export const COMMERCIAL_TIMEFRAMES: readonly EnquiryOption[] = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '1-3-months', label: 'Within 1–3 months' },
  { value: '3-plus-months', label: 'More than 3 months away' },
  { value: 'planning', label: 'Still planning' },
  { value: 'tender', label: 'Going to tender' },
] as const;
