import type { z } from 'zod';
import {
  COMMERCIAL_PROPERTY_TYPES,
  COMMERCIAL_TIMEFRAMES,
  RESIDENTIAL_PROPERTY_TYPES,
  RESIDENTIAL_TIMEFRAMES,
  RESIDENTIAL_WORK_TYPES,
  type EnquiryOption,
} from './options';
import { commercialEnquirySchema, residentialEnquirySchema } from '@/lib/validation/enquiry';

/**
 * The quote chat, as data.
 *
 * The floating chat asks the same questions as the enquiry forms and submits
 * through the same Server Action — it is a second way through one pipeline, not
 * a second pipeline. Keeping the conversation as plain data (rather than as JSX
 * branches) means the flow can be checked against the Zod schema in a unit
 * test, so a renamed field or a new enum value cannot silently leave the chat
 * sending payloads the server will refuse.
 *
 * Deliberately not a chatbot. It answers nothing and claims nothing: every
 * turn is a question APMG needs answered in order to quote. A site that
 * refuses to render an unverified accreditation has no business generating
 * prose about warranties.
 */

export type EnquiryFormType = 'residential' | 'commercial';

export type ChatFieldKind =
  /** One tap from a fixed list. */
  | 'choice'
  /** Single-line free text. */
  | 'text'
  /** Multi-line free text. */
  | 'textarea'
  /** An opt-in — yes or no. */
  | 'confirm';

export type ChatField = {
  /** Must be a field name the enquiry schema accepts. */
  name: string;
  /** The visible <label>. Never placeholder-only. */
  label: string;
  kind: ChatFieldKind;
  /** Required for `choice`; values must be the schema's enum members. */
  options?: readonly EnquiryOption[];
  hint?: string;
  autoComplete?: string;
  inputType?: 'text' | 'tel' | 'email';
  /** True only where the schema itself allows the answer to be left out. */
  optional?: boolean;
};

export type ChatStep = {
  id: string;
  /** What the assistant says. One question per turn. */
  prompt: string;
  /**
   * Usually one field. Grouped only where splitting them would be worse for
   * the visitor — name, phone and email belong on one turn, not three.
   */
  fields: readonly ChatField[];
};

export type ChatFlow = {
  formType: EnquiryFormType;
  /** Names the branch in the transcript, e.g. "Home painting". */
  label: string;
  steps: readonly ChatStep[];
};

const SCHEMAS = {
  residential: residentialEnquirySchema,
  commercial: commercialEnquirySchema,
} as const;

/** Shared closing turn. Both audiences are reached the same way. */
const CONTACT_STEP: ChatStep = {
  id: 'contact',
  prompt: 'Last one — how should we reach you?',
  fields: [
    { name: 'name', label: 'Your name', kind: 'text', autoComplete: 'name' },
    { name: 'phone', label: 'Phone', kind: 'text', inputType: 'tel', autoComplete: 'tel' },
    { name: 'email', label: 'Email', kind: 'text', inputType: 'email', autoComplete: 'email' },
  ],
};

/**
 * The opening turn. Sets `formType`, which decides both the branch below and
 * the schema the Server Action validates against.
 */
export const AUDIENCE_STEP: ChatStep = {
  id: 'audience',
  prompt: 'Hi — what can we help you paint?',
  fields: [
    {
      name: 'formType',
      label: 'What kind of work is it?',
      kind: 'choice',
      options: [
        { value: 'residential', label: 'My home' },
        { value: 'commercial', label: 'A business or facility' },
      ],
    },
  ],
};

export const flows: Record<EnquiryFormType, ChatFlow> = {
  residential: {
    formType: 'residential',
    label: 'Home painting',
    steps: [
      {
        id: 'suburb',
        prompt: 'Whereabouts is the property?',
        fields: [
          {
            name: 'suburb',
            label: 'Suburb',
            kind: 'text',
            autoComplete: 'address-level2',
          },
        ],
      },
      {
        id: 'work-type',
        prompt: 'What needs painting?',
        fields: [
          {
            name: 'workType',
            label: 'Interior, exterior or both',
            kind: 'choice',
            options: RESIDENTIAL_WORK_TYPES,
          },
        ],
      },
      {
        id: 'property-type',
        prompt: 'And what sort of home is it?',
        fields: [
          {
            name: 'propertyType',
            label: 'Property type',
            kind: 'choice',
            options: RESIDENTIAL_PROPERTY_TYPES,
          },
        ],
      },
      {
        id: 'timeframe',
        prompt: 'When are you hoping to have it done?',
        fields: [
          {
            name: 'timeframe',
            label: 'Approximate timeframe',
            kind: 'choice',
            options: RESIDENTIAL_TIMEFRAMES,
          },
        ],
      },
      {
        id: 'description',
        prompt: 'Tell us a little about the job.',
        fields: [
          {
            name: 'description',
            label: 'About the job',
            kind: 'textarea',
            hint: 'Rough size, number of rooms, condition of the surfaces — whatever you know.',
          },
        ],
      },
      CONTACT_STEP,
    ],
  },

  commercial: {
    formType: 'commercial',
    label: 'Commercial painting',
    steps: [
      {
        id: 'organisation',
        prompt: 'Which organisation are you with?',
        fields: [
          {
            name: 'organisation',
            label: 'Organisation',
            kind: 'text',
            autoComplete: 'organization',
          },
        ],
      },
      {
        id: 'property-type',
        prompt: 'What kind of site is it?',
        fields: [
          {
            name: 'propertyType',
            label: 'Property or sector type',
            kind: 'choice',
            options: COMMERCIAL_PROPERTY_TYPES,
          },
        ],
      },
      {
        id: 'project-location',
        prompt: 'Where is the work?',
        fields: [
          {
            name: 'projectLocation',
            label: 'Project location',
            kind: 'text',
            hint: 'Suburb, or multiple sites.',
          },
        ],
      },
      {
        id: 'scope',
        prompt: 'What is the scope, roughly?',
        fields: [
          {
            name: 'scopeSummary',
            label: 'Scope summary',
            kind: 'textarea',
            hint: 'Areas involved, interior or exterior, approximate size, and anything already specified.',
          },
        ],
      },
      {
        id: 'timeframe',
        prompt: 'What timeframe are you working to?',
        fields: [
          {
            name: 'timeframe',
            label: 'Desired timeframe',
            kind: 'choice',
            options: COMMERCIAL_TIMEFRAMES,
          },
        ],
      },
      {
        id: 'operating-hours',
        prompt: 'Anything that limits when we can be on site?',
        fields: [
          {
            name: 'operatingHoursConstraints',
            label: 'Operating-hours constraints',
            kind: 'textarea',
            optional: true,
            hint: 'Trading hours, term dates, shift patterns, after-hours access.',
          },
        ],
      },
      {
        id: 'site-assessment',
        prompt: 'Would you like us to attend site before quoting?',
        fields: [
          {
            name: 'siteAssessmentRequested',
            label: 'Request a site assessment',
            kind: 'confirm',
            optional: true,
            hint: 'We attend site before quoting commercial work wherever possible.',
          },
        ],
      },
      CONTACT_STEP,
    ],
  },
};

/** Every question in a branch, opening turn included, in order. */
export function stepsFor(formType: EnquiryFormType): readonly ChatStep[] {
  return flows[formType].steps;
}

/**
 * Validate one answer using the schema's own rule for that field.
 *
 * The chat must never disagree with the server about what is acceptable, so it
 * does not restate the rules — it runs the same ones and surfaces the same
 * message. This is a convenience for the visitor, never a control: the Server
 * Action re-validates the whole payload regardless.
 */
export function validateField(
  formType: EnquiryFormType,
  name: string,
  value: string,
): string | undefined {
  const shape: Record<string, z.ZodTypeAny> = SCHEMAS[formType].shape;
  const fieldSchema = shape[name];
  if (!fieldSchema) return undefined;

  const result = fieldSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

/**
 * Assemble the payload for `submitEnquiry`.
 *
 * Identical in shape to what the real forms post, including the empty honeypot
 * and the `renderedAt` stamp, so the chat passes through exactly the same
 * anti-spam checks rather than around them.
 *
 * Unanswered fields are omitted rather than sent empty: an absent optional
 * field takes the schema's default, while an empty string can fail a `min()`.
 * Nothing is inferred or filled in on the visitor's behalf.
 */
export function buildEnquiryFormData({
  formType,
  answers,
  renderedAt,
  honeypot = '',
}: {
  formType: EnquiryFormType;
  answers: Readonly<Record<string, string>>;
  renderedAt: number;
  /**
   * Whatever was in the hidden honeypot field. Passed through untouched rather
   * than forced empty, so a bot that fills every input is still rejected by the
   * server's own check instead of being cleaned up on the way out.
   */
  honeypot?: string;
}): FormData {
  const data = new FormData();

  data.set('formType', formType);
  data.set('company_website', honeypot);
  data.set('renderedAt', String(renderedAt));

  for (const [name, value] of Object.entries(answers)) {
    const trimmed = value.trim();
    if (trimmed === '') continue;
    data.set(name, trimmed);
  }

  return data;
}
