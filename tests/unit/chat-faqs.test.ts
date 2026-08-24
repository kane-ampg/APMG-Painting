import { describe, expect, it } from 'vitest';
import { faqs } from '@/content/faqs';
import { QUICK_ANSWERS, QUICK_QUESTIONS } from '@/lib/enquiry/chat-faqs';

/**
 * The chat's quick answers.
 *
 * The chat is allowed to answer only what the site already publishes, word for
 * word. Nothing here may be written for the chat, paraphrased, or softened:
 * this rebuild exists because the live WordPress site made claims nobody had
 * verified, and a chat bubble is not a lower standard of publication than a
 * page.
 */

describe('every quick answer comes from the published FAQs', () => {
  it('picks five questions', () => {
    expect(QUICK_QUESTIONS).toHaveLength(5);
    expect(QUICK_ANSWERS).toHaveLength(5);
  });

  it('names only questions that exist in content/faqs.ts', () => {
    const published = new Set(faqs.map((faq) => faq.question));
    for (const question of QUICK_QUESTIONS) {
      expect(published, `"${question}" is not a published FAQ`).toContain(question);
    }
  });

  it('quotes the published answer verbatim', () => {
    for (const entry of QUICK_ANSWERS) {
      const source = faqs.find((faq) => faq.question === entry.question);
      expect(source?.answer).toBe(entry.answer);
    }
  });

  it('asks nothing twice', () => {
    expect(new Set(QUICK_QUESTIONS).size).toBe(QUICK_QUESTIONS.length);
  });

  it('covers both audiences, since the opening turn does not know which one it is', () => {
    const audiences = new Set(
      QUICK_ANSWERS.map((entry) => faqs.find((faq) => faq.question === entry.question)?.audience),
    );
    expect(audiences).toContain('commercial');
    expect(audiences).toContain('residential');
  });

  it('never invents a price', () => {
    // The site quotes after seeing a site or property, never in a chat bubble.
    for (const entry of QUICK_ANSWERS) {
      expect(entry.answer).not.toMatch(/\$\d/);
    }
  });
});
