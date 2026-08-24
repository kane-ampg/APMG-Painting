import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  AUDIENCE_STEP,
  buildEnquiryFormData,
  flows,
  validateField,
  type ChatFlow,
} from '@/lib/enquiry/chat-flow';
import { commercialEnquirySchema, residentialEnquirySchema } from '@/lib/validation/enquiry';

/**
 * The chat flow asks the same questions the enquiry forms ask, and submits
 * through the same Server Action. If the two ever drift — a renamed field, a
 * new enum value, a question quietly dropped — the chat starts sending payloads
 * the server rejects, and the visitor sees a dead end they cannot fix.
 *
 * These tests derive their expectations from the Zod schemas themselves, so the
 * schema stays the single source of truth and drift fails the build.
 */

/** Fields the schema owns rather than the conversation: set by machine. */
const MACHINE_FIELDS = new Set(['formType', 'company_website', 'renderedAt']);

/** The schema's fields, indexable by name. */
function shapeOf(schema: { shape: object }): Record<string, z.ZodTypeAny> {
  return schema.shape as Record<string, z.ZodTypeAny>;
}

function dataFields(schema: { shape: object }): string[] {
  return Object.keys(shapeOf(schema)).filter((key) => !MACHINE_FIELDS.has(key));
}

function flowFields(flow: ChatFlow): string[] {
  return flow.steps.flatMap((step) => step.fields.map((field) => field.name));
}

const CASES = [
  ['residential', residentialEnquirySchema, flows.residential],
  ['commercial', commercialEnquirySchema, flows.commercial],
] as const;

describe('the chat flow matches the enquiry schema', () => {
  it.each(CASES)(
    'the %s flow asks for exactly the fields the schema accepts',
    (_n, schema, flow) => {
      expect(flowFields(flow).sort()).toEqual(dataFields(schema).sort());
    },
  );

  it.each(CASES)('the %s flow asks each question only once', (_n, _schema, flow) => {
    const names = flowFields(flow);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(CASES)('%s step ids are unique', (_n, _schema, flow) => {
    const ids = flow.steps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(CASES)('%s choice options are exactly the schema enum values', (_n, schema, flow) => {
    const choices = flow.steps
      .flatMap((step) => step.fields)
      .filter((field) => field.kind === 'choice');

    // Guard against a flow that has quietly lost all its choice fields.
    expect(choices.length).toBeGreaterThan(0);

    for (const field of choices) {
      const fieldSchema = shapeOf(schema)[field.name];
      expect(fieldSchema, `no schema field named "${field.name}"`).toBeDefined();
      expect(fieldSchema).toBeInstanceOf(z.ZodEnum);

      const allowed = (fieldSchema as z.ZodEnum<[string, ...string[]]>).options;
      expect(field.options?.map((option) => option.value)).toEqual([...allowed]);
    }
  });

  it.each(CASES)('%s fields the schema lets you skip are marked optional', (_n, schema, flow) => {
    for (const field of flow.steps.flatMap((step) => step.fields)) {
      expect(Boolean(field.optional), `field "${field.name}"`).toBe(
        shapeOf(schema)[field.name]?.isOptional(),
      );
    }
  });

  it.each(CASES)('no %s question mixes tap-to-answer with typed answers', (_n, _schema, flow) => {
    // The widget renders a step as either buttons or a form, never both, so a
    // step that mixed the two kinds would drop half its fields.
    for (const step of flow.steps) {
      const tap = step.fields.filter((f) => f.kind === 'choice' || f.kind === 'confirm').length;
      expect([0, step.fields.length], `step "${step.id}"`).toContain(tap);
    }
  });

  it.each(CASES)('every %s question has a prompt and every field a label', (_n, _schema, flow) => {
    for (const step of flow.steps) {
      expect(step.prompt.length, `step "${step.id}"`).toBeGreaterThan(0);
      for (const field of step.fields) {
        expect(field.label.length, `field "${field.name}"`).toBeGreaterThan(0);
      }
    }
  });
});

describe('the opening question routes to a real flow', () => {
  it('sets formType, so the server picks the matching schema', () => {
    expect(AUDIENCE_STEP.fields).toHaveLength(1);
    expect(AUDIENCE_STEP.fields[0]?.name).toBe('formType');
  });

  it('offers exactly the two flows that exist', () => {
    expect(AUDIENCE_STEP.fields[0]?.options?.map((option) => option.value)).toEqual([
      'residential',
      'commercial',
    ]);
    expect(Object.keys(flows).sort()).toEqual(['commercial', 'residential']);
  });
});

/* ------------------------------------------------------------------ */
/* Submission payload                                                  */
/* ------------------------------------------------------------------ */

const RESIDENTIAL_ANSWERS = {
  suburb: 'Chirnside Park',
  propertyType: 'house',
  workType: 'both',
  timeframe: 'asap',
  description: 'Weatherboard exterior plus three bedrooms inside.',
  name: 'Sam Taylor',
  phone: '0400 000 000',
  email: 'sam@example.com',
};

const COMMERCIAL_ANSWERS = {
  organisation: 'Ramset Aged Care',
  propertyType: 'aged-care-and-retirement',
  projectLocation: 'Chirnside Park VIC',
  scopeSummary: 'Repaint of two resident wings and the common areas.',
  timeframe: 'tender',
  operatingHoursConstraints: 'After 6pm only.',
  siteAssessmentRequested: 'true',
  name: 'Sam Taylor',
  phone: '0400 000 000',
  email: 'sam@example.com',
};

describe('buildEnquiryFormData produces a payload the server accepts', () => {
  it('builds a residential payload the schema parses', () => {
    const data = buildEnquiryFormData({
      formType: 'residential',
      answers: RESIDENTIAL_ANSWERS,
      renderedAt: 1_700_000_000_000,
    });

    const parsed = residentialEnquirySchema.safeParse(Object.fromEntries(data));
    expect(parsed.success, JSON.stringify(parsed.error?.flatten().fieldErrors)).toBe(true);
  });

  it('builds a commercial payload the schema parses', () => {
    const data = buildEnquiryFormData({
      formType: 'commercial',
      answers: COMMERCIAL_ANSWERS,
      renderedAt: 1_700_000_000_000,
    });

    const parsed = commercialEnquirySchema.safeParse(Object.fromEntries(data));
    expect(parsed.success, JSON.stringify(parsed.error?.flatten().fieldErrors)).toBe(true);
  });

  it('carries the form type so the action picks the right schema', () => {
    const data = buildEnquiryFormData({
      formType: 'commercial',
      answers: COMMERCIAL_ANSWERS,
      renderedAt: 1,
    });
    expect(data.get('formType')).toBe('commercial');
  });

  it('sends an empty honeypot, as a real visitor would', () => {
    const data = buildEnquiryFormData({
      formType: 'residential',
      answers: RESIDENTIAL_ANSWERS,
      renderedAt: 1,
    });
    expect(data.get('company_website')).toBe('');
  });

  it('stamps renderedAt so the timing check has something to measure', () => {
    const data = buildEnquiryFormData({
      formType: 'residential',
      answers: RESIDENTIAL_ANSWERS,
      renderedAt: 1_700_000_000_000,
    });
    expect(data.get('renderedAt')).toBe('1700000000000');
  });

  it('omits a skipped optional answer rather than sending an empty string', () => {
    const data = buildEnquiryFormData({
      formType: 'commercial',
      answers: { ...COMMERCIAL_ANSWERS, operatingHoursConstraints: '' },
      renderedAt: 1,
    });
    expect(data.has('operatingHoursConstraints')).toBe(false);
  });

  it('never invents an answer the visitor did not give', () => {
    const data = buildEnquiryFormData({
      formType: 'residential',
      answers: { suburb: 'Ringwood' },
      renderedAt: 1,
    });
    expect([...data.keys()].sort()).toEqual([
      'company_website',
      'formType',
      'renderedAt',
      'suburb',
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* Per-step validation                                                 */
/* ------------------------------------------------------------------ */

describe('validateField reuses the schema rules, so the chat cannot disagree with the server', () => {
  it('rejects a phone number that is too short', () => {
    expect(validateField('residential', 'phone', '123')).toMatch(/8 digits/i);
  });

  it('accepts an Australian mobile written with spaces', () => {
    expect(validateField('residential', 'phone', '0400 000 000')).toBeUndefined();
  });

  it('rejects an address that is not an email', () => {
    expect(validateField('residential', 'email', 'sam@')).toMatch(/valid email/i);
  });

  it('rejects a job description that is too short to act on', () => {
    expect(validateField('residential', 'description', 'paint')).toMatch(/10 characters/i);
  });

  it('accepts an empty answer for a field the schema makes optional', () => {
    expect(validateField('commercial', 'operatingHoursConstraints', '')).toBeUndefined();
  });

  it('rejects an empty answer for a field the schema requires', () => {
    expect(validateField('residential', 'suburb', '')).toBeDefined();
  });

  it('returns the schema message verbatim, not a paraphrase', () => {
    const viaSchema = residentialEnquirySchema.shape.suburb.safeParse('a');
    expect(validateField('residential', 'suburb', 'a')).toBe(
      viaSchema.success ? undefined : viaSchema.error.issues[0]?.message,
    );
  });
});

describe('the honeypot is carried through, not synthesised', () => {
  it('passes a bot-filled honeypot to the server so it is rejected there', () => {
    const data = buildEnquiryFormData({
      formType: 'residential',
      answers: RESIDENTIAL_ANSWERS,
      renderedAt: 1,
      honeypot: 'http://spam.example',
    });
    expect(data.get('company_website')).toBe('http://spam.example');
  });
});
