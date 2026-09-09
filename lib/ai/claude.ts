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

const postSummarySchema = z.object({
  excerpt: z.string().describe('Two sentences, under 300 characters, for the blog index card.'),
  metaTitle: z.string().describe('Under 60 characters, ends with " | APMG Painting".'),
  metaDescription: z.string().describe('Under 155 characters, one specific benefit, no clickbait.'),
});

export async function draftPostSummary(input: { title: string; body: string }) {
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 2000,
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
    max_tokens: 1000,
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
    max_tokens: 1500,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: zodOutputFormat(projectSummarySchema) },
    system: HOUSE_RULES,
    messages: [
      { role: 'user', content: `Summarise this case study from these facts only:\n\n${facts}` },
    ],
  });
  const parsed = response.parsed_output;
  if (!parsed) throw new Error('The model returned no structured output.');
  return { summary: parsed.summary.trim(), metaDescription: clampMeta(parsed.metaDescription) };
}
