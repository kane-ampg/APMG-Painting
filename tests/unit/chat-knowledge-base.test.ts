import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { accreditations, formattedAddress, site } from '@/lib/site';
import { QUICK_ANSWERS, QUICK_QUESTIONS } from '@/lib/enquiry/chat-faqs';

/**
 * The chat knowledge base.
 *
 * `docs/chat-knowledge-base.md` is what a model will be grounded in once the
 * chat stops being purely scripted. A grounding document that has drifted from
 * the site is worse than none: it launders stale claims into confident answers.
 *
 * So the canonical facts are asserted to be present and correct, every verified
 * credential is asserted to be reproduced, and any credential that is *not*
 * verified is asserted to be listed as unsayable. This cannot check prose for
 * honesty — it can stop the specific drift that matters.
 */

// Resolved from the Vitest root, which is the project root.
const KB = readFileSync(resolve(process.cwd(), 'docs/chat-knowledge-base.md'), 'utf8');

describe('the knowledge base carries the canonical business facts', () => {
  it.each([
    ['trading name', site.name],
    ['legal name', site.legalName],
    ['phone', site.phone.display],
    ['tel: href', site.phone.href.replace('tel:', '')],
    ['email', site.email],
    ['address', formattedAddress],
    ['founding year', String(site.founded)],
    ['service radius', String(site.serviceArea.radiusKm)],
  ])('states the %s', (_label, value) => {
    expect(KB).toContain(value);
  });

  it('does not publish an ABN, because the site has none', () => {
    expect(site.abn).toBeNull();
    expect(KB).not.toMatch(/ABN[:\s]+\d/i);
  });
});

describe('the knowledge base states the credential set exactly', () => {
  const verified = accreditations.filter((entry) => entry.verified);
  const unverified = accreditations.filter((entry) => !entry.verified);

  // §4 is the section a grounded model reads before answering "are you
  // insured?". Both halves are asserted against lib/site.ts so that flipping a
  // `verified` flag without updating this document fails the build rather than
  // quietly teaching the chat to overclaim — or to under-claim a credential
  // APMG holds.
  const section = () => KB.slice(KB.indexOf('## 4. What'), KB.indexOf('## 5. What APMG does'));

  it('has a credential set to guard', () => {
    expect(accreditations.length).toBeGreaterThan(0);
  });

  it.each(verified.map((entry) => [entry.label] as const))('reproduces "%s"', (label) => {
    expect(section()).toContain(label);
  });

  it.each(unverified.map((entry) => [entry.label] as const))('lists "%s" as unsayable', (label) => {
    expect(section()).toContain(label);
  });

  it('holds the line on the two corrections from the audit', () => {
    // The live site calls it an "NDIS Accreditation" and cites a body called
    // "Workplace Safety". Neither exists. Both are named in §4 so a grounded
    // model repeats the correction instead of the error.
    expect(section()).toMatch(/Worker Screening Check/);
    expect(section()).toMatch(/no body called "Workplace Safety"/i);
  });

  it('attributes the Google rating to Google rather than to the site', () => {
    expect(section()).toMatch(/never as the site's own rating/i);
  });

  it('tells the model to refuse a price rather than estimate one', () => {
    expect(KB).toMatch(/never state a price/i);
  });

  it('tells the model to decline what it cannot source', () => {
    expect(KB).toMatch(/say you do not know/i);
  });
});

describe('the knowledge base stays in step with the chat', () => {
  it.each(QUICK_QUESTIONS.map((question) => [question] as const))(
    'reproduces the quick question "%s"',
    (question) => {
      expect(KB).toContain(question);
    },
  );

  it('reproduces each quick answer verbatim', () => {
    // Line wrapping in Markdown is fine; the words are not.
    const flattened = KB.replace(/\s+/g, ' ');
    for (const entry of QUICK_ANSWERS) {
      expect(flattened).toContain(entry.answer.replace(/\s+/g, ' '));
    }
  });
});
