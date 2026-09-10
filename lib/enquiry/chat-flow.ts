import type { z } from 'zod';
import {
  ASSESSMENT_TYPES,
  COMMERCIAL_PROPERTY_TYPES,
  SITE_REGIONS,
  availableOptions as filterOptions,
  type EnquiryOption,
} from './options';
import { siteAssessmentFields } from '@/lib/validation/enquiry';

/**
 * The site assessment chat, as data.
 *
 * The floating chat asks the same questions as the booking form and submits
 * through the same Server Action — it is a second way through one pipeline, not
 * a second pipeline. Keeping the conversation as plain data (rather than as JSX
 * branches) means the flow can be checked against the Zod schema in a unit
 * test, so a renamed field or a new enum value cannot silently leave the chat
 * sending payloads the server will refuse.
 *
 * Deliberately not a chatbot. It answers nothing and claims nothing: every
 * turn is a question APMG needs answered in order to book an assessment. A
 * site that refuses to render an unverified accreditation has no business
 * generating prose about warranties.
 */

/**
 * One member on purpose. This site is commercial only, and a one-member union
 * keeps every call site typed, so re-widening later is a type change the
 * compiler walks you through rather than a grep.
 */
export type EnquiryFormType = 'commercial';

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
  /** Must be a field name the booking schema accepts. */
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
   * the visitor — organisation, name, phone and email belong on one turn, not
   * four.
   */
  fields: readonly ChatField[];
};

export type ChatFlow = {
  formType: EnquiryFormType;
  /** Names the flow in the transcript, e.g. "Site assessment". */
  label: string;
  steps: readonly ChatStep[];
};

const SCHEMAS = {
  commercial: siteAssessmentFields,
} as const;

/** The closing turn every branch ends on. */
const CONTACT_STEP: ChatStep = {
  id: 'contact',
  prompt: 'Last one — who should we confirm the booking with?',
  fields: [
    { name: 'organisation', label: 'Organisation', kind: 'text', autoComplete: 'organization' },
    { name: 'name', label: 'Your name', kind: 'text', autoComplete: 'name' },
    { name: 'phone', label: 'Phone', kind: 'text', inputType: 'tel', autoComplete: 'tel' },
    {
      name: 'email',
      label: 'Work email',
      kind: 'text',
      inputType: 'email',
      autoComplete: 'email',
      hint: 'We send the confirmation, and the Google Meet link, here.',
    },
  ],
};

export const flows: Record<EnquiryFormType, ChatFlow> = {
  commercial: {
    formType: 'commercial',
    label: 'Site assessment',
    steps: [
      {
        id: 'site-region',
        prompt: 'Where is the site?',
        fields: [
          {
            name: 'siteRegion',
            label: 'Site region',
            kind: 'choice',
            options: SITE_REGIONS,
          },
        ],
      },
      {
        id: 'assessment-type',
        prompt: 'How would you like us to do the assessment?',
        fields: [
          {
            name: 'assessmentType',
            label: 'Assessment type',
            kind: 'choice',
            options: ASSESSMENT_TYPES,
            hint: 'On-site visits are Melbourne-only for now. Everywhere else we start with a call.',
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
        id: 'site-address',
        prompt: 'Where exactly is the site?',
        fields: [
          {
            name: 'siteAddress',
            label: 'Site address',
            kind: 'text',
            autoComplete: 'street-address',
            hint: 'Street address for an on-site visit. A suburb is enough for an online assessment.',
          },
        ],
      },
      {
        id: 'preferred-times',
        prompt: 'When suits you?',
        fields: [
          {
            name: 'preferredTimes',
            label: 'Preferred times',
            kind: 'textarea',
            hint: 'Two or three windows, e.g. Tuesday morning or Thursday after 2pm. We confirm by email.',
          },
        ],
      },
      {
        id: 'notes',
        prompt: 'Anything we should know before we come?',
        fields: [
          {
            name: 'notes',
            label: 'Notes',
            kind: 'textarea',
            optional: true,
            hint: 'Access, sign-in, what needs painting — whatever helps.',
          },
        ],
      },
      CONTACT_STEP,
    ],
  },
};

/**
 * The options a visitor may tap for a choice field, given their earlier
 * answers. The on-site visit disappears outside Melbourne rather than being
 * offered and then refused by the server.
 */
export function availableOptions(
  field: ChatField,
  answers: Readonly<Record<string, string | undefined>>,
): readonly EnquiryOption[] {
  return filterOptions(field.options, answers);
}

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
