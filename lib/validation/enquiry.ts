import { z } from 'zod';

/**
 * Site assessment booking schema.
 *
 * The site's one call to action is a free site assessment, so the form asks
 * what is needed to book one rather than what is needed to price a job: where
 * the site is, whether the visitor wants us there or on a call, when suits,
 * and how to reach them. Scope is a conversation, not a required essay.
 *
 * On-site visits are offered in metropolitan Melbourne only — that is the
 * area APMG can evidence and staff. Everywhere else is offered an online
 * scoping call over Google Meet. The rule lives here, as a cross-field
 * refinement, so neither the form nor the chat can be talked around it.
 *
 * Shared by the client and the server. The server always re-validates; client
 * validation is a convenience, never a control.
 */

const name = z.string().trim().min(2, 'Enter your name.').max(100, 'That name is too long.');

const email = z
  .string()
  .trim()
  .min(1, 'Enter your work email address.')
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
 * Anti-spam fields, present on every route into the pipeline.
 * `company_website` is a honeypot — hidden from users, so any value means a bot.
 * `renderedAt` supports a minimum-completion-time check on the server.
 */
const antiSpam = {
  company_website: z.string().max(0, 'Rejected.').optional().default(''),
  renderedAt: z.coerce.number().int().nonnegative(),
};

export const SITE_REGIONS = ['melbourne', 'regional-victoria', 'interstate'] as const;
export const ASSESSMENT_TYPES = ['onsite', 'online'] as const;

/** The region an on-site visit is offered in. Everywhere else is online only. */
export const ONSITE_REGION = 'melbourne';

export const ONSITE_OUTSIDE_MELBOURNE_MESSAGE =
  'On-site assessments are Melbourne-only for now. Choose an online assessment and we will call you.';

/**
 * The fields, as a plain object schema.
 *
 * Kept separate from the refined schema below because the chat validates one
 * answer at a time against `.shape`, and a refined schema has no shape.
 */
export const siteAssessmentFields = z.object({
  ...antiSpam,
  formType: z.literal('commercial'),
  siteRegion: z.enum(SITE_REGIONS, {
    errorMap: () => ({ message: 'Tell us where the site is.' }),
  }),
  assessmentType: z.enum(ASSESSMENT_TYPES, {
    errorMap: () => ({ message: 'Choose an on-site visit or an online assessment.' }),
  }),
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
  siteAddress: z
    .string()
    .trim()
    .min(3, 'Enter the site address — a suburb is enough for an online assessment.')
    .max(200, 'Please keep this under 200 characters.'),
  preferredTimes: z
    .string()
    .trim()
    .min(3, 'Tell us two or three times that suit you.')
    .max(500, 'Please keep this under 500 characters.'),
  notes: z
    .string()
    .trim()
    .max(1000, 'Please keep this under 1000 characters.')
    .optional()
    .default(''),
  organisation: z.string().trim().min(2, 'Enter your organisation.').max(150),
  name,
  phone,
  email,
});

export const siteAssessmentSchema = siteAssessmentFields.superRefine((data, ctx) => {
  if (data.assessmentType === 'onsite' && data.siteRegion !== ONSITE_REGION) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['assessmentType'],
      message: ONSITE_OUTSIDE_MELBOURNE_MESSAGE,
    });
  }
});

export type SiteAssessmentRequest = z.infer<typeof siteAssessmentSchema>;
/** Kept as its own alias so callers describe the payload generically. */
export type Enquiry = SiteAssessmentRequest;

/** Minimum seconds between form render and submit. Below this it is a bot. */
export const MIN_COMPLETION_SECONDS = 3;
