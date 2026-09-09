import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
// The SDK's `zodOutputFormat()` helper is typed against the zod/v4 core
// (`import * as z from 'zod/v4'` in helpers/zod.d.ts), not the classic zod
// package export the rest of this codebase uses. This project pins
// `"zod": "^3.24.1"`, resolved to 3.25.76, which ships the v4 API as an
// opt-in subpath: a schema built with the default `zod` import does not
// satisfy the helper's `z.ZodType` constraint, but one built from `zod/v4`
// does. So schemas destined for `zodOutputFormat` are built with `zod/v4`
// here; nothing else in the app needs to change.
import { z } from 'zod/v4';
import type { Project } from '@/lib/content/types';

/**
 * Editor-facing AI assist. Three short, single-call tasks. Every result is
 * schema-validated before it reaches a form field, and nothing here writes
 * to the database: the editor still has to save.
 */

export const MODEL = 'claude-opus-5';

export const HOUSE_RULES = [
  'You write for APMG Painting, a commercial painting contractor in Melbourne, Australia.',
  'Use Australian English spelling. Refer to the company only as "APMG Painting".',
  'The company is commercial only: offices, schools, healthcare, industrial, strata, retail. Never describe painting work on private homes or single-dwelling properties.',
  'Do not invent facts, figures, durations, client names, products or outcomes. Use only what the source material states. If something is unknown, leave it out.',
  'Plain, specific, unhurried prose. No marketing superlatives, no exclamation marks, no emoji.',
].join(' ');

export function hasAi(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function clampMeta(text: string, max = 160): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max - 1).replace(/[,;:\s]+$/, '')}…`;
}

const client = () => new Anthropic();

/**
 * Opus 5 thinks by default, and thinking counts against `max_tokens`. At the
 * 1000-2000 these calls used to ask for, a task that reasoned at all ran out
 * of budget before writing its structured output, and the only symptom was
 * `parsed_output` coming back empty. 8000 is generous for three fields of
 * prose and still bounded.
 */
const MAX_TOKENS = 8000;

/**
 * A refusal is an HTTP 200 with `stop_reason: 'refusal'` and no output, so it
 * has to be checked before `parsed_output` — otherwise it reads as "the
 * model returned no structured output", which sends the editor looking for a
 * bug in the form. `fallbacks: 'default'` above means the whole chain
 * declined by the time this fires.
 */
function assertNotRefused(stopReason: string | null | undefined): void {
  if (stopReason === 'refusal') {
    throw new Error('The model declined this request. Edit the text and try again.');
  }
}

const postSummarySchema = z.object({
  excerpt: z.string().describe('Two sentences, under 300 characters, for the blog index card.'),
  metaTitle: z.string().describe('Under 60 characters, ends with " | APMG Painting".'),
  metaDescription: z.string().describe('Under 155 characters, one specific benefit, no clickbait.'),
});

export async function draftPostSummary(input: { title: string; body: string }) {
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: zodOutputFormat(postSummarySchema) },
    system: HOUSE_RULES,
    messages: [
      {
        role: 'user',
        content: `Draft the excerpt, meta title and meta description for this blog post.\n\nTitle: ${input.title}\n\n${input.body}`,
      },
    ],
  });
  assertNotRefused(response.stop_reason);
  const parsed = response.parsed_output;
  if (!parsed) throw new Error('The model returned no structured output.');
  return {
    excerpt: parsed.excerpt.trim().slice(0, 300),
    metaTitle: parsed.metaTitle.trim().slice(0, 70),
    metaDescription: clampMeta(parsed.metaDescription),
  };
}

const imageSchema = z.object({
  alt: z
    .string()
    .describe(
      'Under 125 characters. What a screen reader user needs. Names the surface, action and setting. No "image of".',
    ),
  caption: z.string().describe('One sentence for a gallery caption.'),
});

export async function describeImage(imageUrl: string) {
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: zodOutputFormat(imageSchema) },
    system: HOUSE_RULES,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          {
            type: 'text',
            text: 'Write alt text and a caption for this photograph from an APMG Painting job. Describe only what is visible.',
          },
        ],
      },
    ],
  });
  assertNotRefused(response.stop_reason);
  const parsed = response.parsed_output;
  if (!parsed) throw new Error('The model returned no structured output.');
  return { alt: parsed.alt.trim().slice(0, 125), caption: parsed.caption.trim() };
}

const projectSummarySchema = z.object({
  summary: z.string().describe('Two or three sentences for a project card.'),
  metaDescription: z.string().describe('Under 155 characters.'),
});

export async function summariseProject(project: Project) {
  const facts = JSON.stringify(
    {
      title: project.title,
      clientOrPropertyType: project.clientOrPropertyType,
      location: project.location,
      challenge: project.challenge,
      scopeOfWork: project.scopeOfWork,
      outcome: project.outcome,
    },
    null,
    2,
  );
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: zodOutputFormat(projectSummarySchema) },
    system: HOUSE_RULES,
    messages: [
      { role: 'user', content: `Summarise this case study from these facts only:\n\n${facts}` },
    ],
  });
  assertNotRefused(response.stop_reason);
  const parsed = response.parsed_output;
  if (!parsed) throw new Error('The model returned no structured output.');
  return { summary: parsed.summary.trim(), metaDescription: clampMeta(parsed.metaDescription) };
}
