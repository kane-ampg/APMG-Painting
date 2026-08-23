import { z } from 'zod';

/**
 * Enquiry schemas.
 *
 * Two audiences, two schemas. The live WordPress site runs one Contact Form 7
 * instance on every page — name, phone, email, address, suburb, a service
 * dropdown and a message — which asks a facilities manager and a homeowner the
 * same questions and gets useful answers from neither.
 *
 * These schemas are shared by the client and the server. The server always
 * re-validates; client validation is a convenience, never a control.
 */

const name = z.string().trim().min(2, 'Enter your name.').max(100, 'That name is too long.');

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .email('Enter a valid email address, like name@example.com.')
  .max(254);

/** Deliberately permissive — AU numbers are written many ways. */
const phone = z
  .string()
  .trim()
  .min(8, 'Enter a contact number with at least 8 digits.')
  .max(20, 'That number is too long.')
  .regex(/^[0-9+()\s-]+$/, 'Use digits, spaces, and + ( ) - only.');

/**
 * Anti-spam fields, present on both forms.
 * `company_website` is a honeypot — hidden from users, so any value means a bot.
 * `renderedAt` supports a minimum-completion-time check on the server.
 */
const antiSpam = {
  company_website: z.string().max(0, 'Rejected.').optional().default(''),
  renderedAt: z.coerce.number().int().nonnegative(),
};

export const residentialEnquirySchema = z.object({
  ...antiSpam,
  formType: z.literal('residential'),
  name,
  phone,
  email,
  suburb: z.string().trim().min(2, 'Enter your suburb.').max(80),
  propertyType: z.enum(['house', 'apartment', 'townhouse', 'other'], {
    errorMap: () => ({ message: 'Choose a property type.' }),
  }),
  workType: z.enum(['interior', 'exterior', 'both'], {
    errorMap: () => ({ message: 'Choose interior, exterior or both.' }),
  }),
  timeframe: z.enum(['asap', '1-3-months', '3-plus-months', 'planning'], {
    errorMap: () => ({ message: 'Choose an approximate timeframe.' }),
  }),
  description: z
    .string()
    .trim()
    .min(10, 'Tell us a little about the job — 10 characters or more.')
    .max(4000, 'Please keep this under 4000 characters.'),
});

export const commercialEnquirySchema = z.object({
  ...antiSpam,
  formType: z.literal('commercial'),
  name,
  organisation: z.string().trim().min(2, 'Enter your organisation.').max(150),
  phone,
  email,
  propertyType: z.enum(
    [
      'education-and-childcare',
      'healthcare',
      'aged-care-and-retirement',
      'body-corporate-and-strata',
      'retail',
      'hospitality',
      'leisure-and-sports',
      'industrial',
      'office',
      'other',
    ],
    { errorMap: () => ({ message: 'Choose a property or sector type.' }) },
  ),
  projectLocation: z.string().trim().min(2, 'Enter the project location.').max(150),
  scopeSummary: z
    .string()
    .trim()
    .min(10, 'Give us a short scope summary — 10 characters or more.')
    .max(4000, 'Please keep this under 4000 characters.'),
  timeframe: z.enum(['asap', '1-3-months', '3-plus-months', 'planning', 'tender'], {
    errorMap: () => ({ message: 'Choose a desired timeframe.' }),
  }),
  operatingHoursConstraints: z
    .string()
    .trim()
    .max(1000, 'Please keep this under 1000 characters.')
    .optional()
    .default(''),
  siteAssessmentRequested: z.coerce.boolean().optional().default(false),
});

export const enquirySchema = z.discriminatedUnion('formType', [
  residentialEnquirySchema,
  commercialEnquirySchema,
]);

export type ResidentialEnquiry = z.infer<typeof residentialEnquirySchema>;
export type CommercialEnquiry = z.infer<typeof commercialEnquirySchema>;
export type Enquiry = z.infer<typeof enquirySchema>;

/** Minimum seconds between form render and submit. Below this it is a bot. */
export const MIN_COMPLETION_SECONDS = 3;
