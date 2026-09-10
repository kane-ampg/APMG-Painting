/**
 * Canonical choice labels for the booking enums.
 *
 * Two surfaces ask the same questions — the booking form on the contact page
 * and the floating chat — and a third (the eventual CRM mapping) will read the
 * same values. The values must match `lib/validation/enquiry.ts` exactly or
 * the server rejects the submission, and the labels must match each other or
 * the same question reads differently depending on where a visitor happens to
 * answer it. Both live here, once.
 *
 * `tests/unit/chat-flow.test.ts` asserts these value lists are exactly the Zod
 * enum members, so adding a schema value without a label fails the build.
 */

export type EnquiryOption = {
  value: string;
  label: string;
  /** A second line under the label, where the choice needs explaining. */
  description?: string;
  /**
   * Offered only when another answer has this value. The schema enforces the
   * same rule server-side; this lets the form and the chat stop a visitor
   * choosing something the server would refuse.
   */
  requires?: { field: string; value: string };
};

export const SITE_REGIONS: readonly EnquiryOption[] = [
  { value: 'melbourne', label: 'Metropolitan Melbourne' },
  { value: 'regional-victoria', label: 'Elsewhere in Victoria' },
  { value: 'interstate', label: 'Interstate' },
] as const;

export const ASSESSMENT_TYPES: readonly EnquiryOption[] = [
  {
    value: 'onsite',
    label: 'On-site visit',
    description: 'One of our team walks the site with you. Melbourne only for now.',
    requires: { field: 'siteRegion', value: 'melbourne' },
  },
  {
    value: 'online',
    label: 'Online assessment',
    description: 'A short Google Meet call at a time that suits you.',
  },
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

/**
 * The options a visitor may actually pick, given what they have already
 * answered. Pure, so the form, the chat and the tests share it.
 */
export function availableOptions(
  options: readonly EnquiryOption[] | undefined,
  answers: Readonly<Record<string, string | undefined>>,
): readonly EnquiryOption[] {
  if (!options) return [];
  return options.filter(
    (option) => !option.requires || answers[option.requires.field] === option.requires.value,
  );
}
