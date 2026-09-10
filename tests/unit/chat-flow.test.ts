import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  availableOptions,
  buildEnquiryFormData,
  flows,
  validateField,
  type ChatFlow,
} from '@/lib/enquiry/chat-flow';
import { siteAssessmentFields, siteAssessmentSchema } from '@/lib/validation/enquiry';

/**
 * The chat flow asks the same questions the booking form asks, and submits
 * through the same Server Action. If the two ever drift — a renamed field, a
 * new enum value, a question quietly dropped — the chat starts sending payloads
 * the server rejects, and the visitor sees a dead end they cannot fix.
 *
 * These tests derive their expectations from the Zod schema itself, so the
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

/** An enum, whether or not it is wrapped in optional()/default(). */
function enumOf(fieldSchema: z.ZodTypeAny): z.ZodEnum<[string, ...string[]]> {
  let inner: z.ZodTypeAny = fieldSchema;
  while (inner instanceof z.ZodOptional || inner instanceof z.ZodDefault) {
    inner = inner instanceof z.ZodOptional ? inner.unwrap() : inner.removeDefault();
  }
  expect(inner).toBeInstanceOf(z.ZodEnum);
  return inner as z.ZodEnum<[string, ...string[]]>;
}

const CASES = [['commercial', siteAssessmentFields, flows.commercial]] as const;

describe('the chat flow matches the booking schema', () => {
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
      const allowed = enumOf(fieldSchema!).options;
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

  it('asks where the site is before offering an on-site visit', () => {
    const ids = flows.commercial.steps.map((step) => step.id);
    expect(ids.indexOf('site-region')).toBeGreaterThanOrEqual(0);
    expect(ids.indexOf('site-region')).toBeLessThan(ids.indexOf('assessment-type'));
  });
});

describe('the on-site option follows the schema’s Melbourne rule', () => {
  const field = flows.commercial.steps
    .flatMap((step) => step.fields)
    .find((f) => f.name === 'assessmentType')!;

  it('offers both an on-site visit and an online assessment in Melbourne', () => {
    expect(availableOptions(field, { siteRegion: 'melbourne' }).map((o) => o.value)).toEqual([
      'onsite',
      'online',
    ]);
  });

  it.each(['regional-victoria', 'interstate'])('offers online only for %s', (region) => {
    expect(availableOptions(field, { siteRegion: region }).map((o) => o.value)).toEqual(['online']);
  });

  it('withholds nothing from a field with no conditions', () => {
    const region = flows.commercial.steps
      .flatMap((step) => step.fields)
      .find((f) => f.name === 'siteRegion')!;
    expect(availableOptions(region, {})).toEqual(region.options);
  });

  it('agrees with the server: what the chat withholds, the schema rejects', () => {
    for (const region of ['melbourne', 'regional-victoria', 'interstate']) {
      const offered = availableOptions(field, { siteRegion: region }).map((o) => o.value);
      for (const type of ['onsite', 'online']) {
        const result = siteAssessmentSchema.safeParse({
          ...ANSWERS,
          formType: 'commercial',
          renderedAt: 1,
          company_website: '',
          siteRegion: region,
          assessmentType: type,
        });
        expect(result.success, `${region} / ${type}`).toBe(offered.includes(type));
      }
    }
  });
});

describe('there is exactly one flow', () => {
  it('offers exactly the flow that exists', () => {
    expect(Object.keys(flows)).toEqual(['commercial']);
  });

  it('opens on the flow’s first step rather than an audience question', () => {
    expect(flows.commercial.steps[0]?.id).not.toBe('audience');
    expect(flows.commercial.steps[0]?.fields.some((field) => field.name === 'formType')).toBe(
      false,
    );
  });
});

/* ------------------------------------------------------------------ */
/* Submission payload                                                  */
/* ------------------------------------------------------------------ */

const ANSWERS = {
  siteRegion: 'melbourne',
  assessmentType: 'onsite',
  propertyType: 'aged-care-and-retirement',
  siteAddress: '30 Ramset Drive, Chirnside Park VIC 3116',
  preferredTimes: 'Any weekday after 2pm.',
  notes: 'Sign in at reception.',
  organisation: 'Ramset Aged Care',
  name: 'Sam Taylor',
  phone: '0400 000 000',
  email: 'sam@example.com',
};

describe('buildEnquiryFormData produces a payload the server accepts', () => {
  it('builds a payload the schema parses', () => {
    const data = buildEnquiryFormData({
      formType: 'commercial',
      answers: ANSWERS,
      renderedAt: 1_700_000_000_000,
    });

    const parsed = siteAssessmentSchema.safeParse(Object.fromEntries(data));
    expect(parsed.success, JSON.stringify(parsed.error?.flatten().fieldErrors)).toBe(true);
  });

  it('carries the form type so the action picks the right schema', () => {
    const data = buildEnquiryFormData({ formType: 'commercial', answers: ANSWERS, renderedAt: 1 });
    expect(data.get('formType')).toBe('commercial');
  });

  it('sends an empty honeypot, as a real visitor would', () => {
    const data = buildEnquiryFormData({ formType: 'commercial', answers: ANSWERS, renderedAt: 1 });
    expect(data.get('company_website')).toBe('');
  });

  it('stamps renderedAt so the timing check has something to measure', () => {
    const data = buildEnquiryFormData({
      formType: 'commercial',
      answers: ANSWERS,
      renderedAt: 1_700_000_000_000,
    });
    expect(data.get('renderedAt')).toBe('1700000000000');
  });

  it('omits a skipped optional answer rather than sending an empty string', () => {
    const data = buildEnquiryFormData({
      formType: 'commercial',
      answers: { ...ANSWERS, notes: '' },
      renderedAt: 1,
    });
    expect(data.has('notes')).toBe(false);
  });

  it('never invents an answer the visitor did not give', () => {
    const data = buildEnquiryFormData({
      formType: 'commercial',
      answers: { organisation: 'Ramset Aged Care' },
      renderedAt: 1,
    });
    expect([...data.keys()].sort()).toEqual([
      'company_website',
      'formType',
      'organisation',
      'renderedAt',
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* Per-step validation                                                 */
/* ------------------------------------------------------------------ */

describe('validateField reuses the schema rules, so the chat cannot disagree with the server', () => {
  it('rejects a phone number that is too short', () => {
    expect(validateField('commercial', 'phone', '123')).toMatch(/8 digits/i);
  });

  it('accepts an Australian mobile written with spaces', () => {
    expect(validateField('commercial', 'phone', '0400 000 000')).toBeUndefined();
  });

  it('rejects an address that is not an email', () => {
    expect(validateField('commercial', 'email', 'sam@')).toMatch(/valid email/i);
  });

  it('rejects a site address too short to find', () => {
    expect(validateField('commercial', 'siteAddress', 'x')).toMatch(/site address/i);
  });

  it('accepts an empty answer for a field the schema makes optional', () => {
    expect(validateField('commercial', 'notes', '')).toBeUndefined();
  });

  it('rejects an empty answer for a field the schema requires', () => {
    expect(validateField('commercial', 'organisation', '')).toBeDefined();
  });

  it('returns the schema message verbatim, not a paraphrase', () => {
    const viaSchema = siteAssessmentFields.shape.organisation.safeParse('a');
    expect(validateField('commercial', 'organisation', 'a')).toBe(
      viaSchema.success ? undefined : viaSchema.error.issues[0]?.message,
    );
  });
});

describe('the honeypot is carried through, not synthesised', () => {
  it('passes a bot-filled honeypot to the server so it is rejected there', () => {
    const data = buildEnquiryFormData({
      formType: 'commercial',
      answers: ANSWERS,
      renderedAt: 1,
      honeypot: 'http://spam.example',
    });
    expect(data.get('company_website')).toBe('http://spam.example');
  });
});
