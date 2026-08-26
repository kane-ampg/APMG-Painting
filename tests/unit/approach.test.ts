import { describe, expect, it } from 'vitest';
import { differentiators } from '@/content/approach';
import { projects } from '@/content/projects';
import { accreditations } from '@/lib/site';

/**
 * The homepage differentiation grid names things: Cm3, Master Painters
 * Australia, Dulux, Emmaus College, the Noble Park factory, eleven NDIS
 * offices. That is the whole point of the rewrite — an unnamed claim is not
 * differentiation and is not citable — but it puts the copy one unverified
 * credential away from asserting something APMG cannot back.
 *
 * These tests are the guard. Each card declares which accreditations and
 * projects its prose leans on; if one loses its `verified` flag or is renamed,
 * the build fails here rather than shipping a claim nobody can support.
 */
describe('differentiators', () => {
  it('fills the three-column grid exactly', () => {
    expect(differentiators.length % 3).toBe(0);
  });

  it('asks a question rather than making a claim', () => {
    for (const d of differentiators) {
      expect(d.question.endsWith('?'), `"${d.question}" is not a question`).toBe(true);
    }
  });

  it('answers in a passage that stands alone if extracted', () => {
    for (const d of differentiators) {
      // Long enough to be a real answer, short enough to be quoted whole.
      const words = d.answer.split(/\s+/).length;
      expect(words, `"${d.question}" is ${words} words`).toBeGreaterThan(35);
      expect(words, `"${d.question}" is ${words} words`).toBeLessThan(110);
      // A passage that opens with "We" or "It" has lost its subject the moment
      // it leaves the page, which is exactly what an answer engine does to it.
      expect(/^(We|It|They|This|That)\b/.test(d.answer), `"${d.question}" opens vaguely`).toBe(
        false,
      );
    }
  });

  it('names a body, a building or a number in most answers', () => {
    const specific = differentiators.filter(
      (d) => (d.credentials?.length ?? 0) > 0 || (d.projects?.length ?? 0) > 0,
    );
    expect(specific.length).toBeGreaterThanOrEqual(4);
  });

  it('only leans on accreditations that are verified', () => {
    const verified = new Set(accreditations.filter((a) => a.verified).map((a) => a.id));
    for (const d of differentiators) {
      for (const id of d.credentials ?? []) {
        expect(verified.has(id), `"${d.question}" cites unverified credential "${id}"`).toBe(true);
      }
    }
  });

  it('only leans on projects that exist', () => {
    const slugs = new Set(projects.map((p) => p.slug));
    for (const d of differentiators) {
      for (const slug of d.projects ?? []) {
        expect(slugs.has(slug), `"${d.question}" cites missing project "${slug}"`).toBe(true);
      }
    }
  });

  it('is unique question by question', () => {
    const questions = differentiators.map((d) => d.question);
    expect(new Set(questions).size).toBe(questions.length);
  });
});
