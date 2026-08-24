import { faqs } from '@/content/faqs';

/**
 * The quick answers the quote chat can give.
 *
 * The chat asks questions; these are the only things it says back. Each entry
 * is looked up in `content/faqs.ts` by its exact question text and quoted
 * verbatim — the chat has no answers of its own, cannot paraphrase, and cannot
 * be given one without that answer also appearing on the site.
 *
 * That constraint is the point. The live WordPress site published claims nobody
 * had verified; a chat bubble is not a lower standard of publication than a
 * page, so it draws from the same reviewed pool.
 *
 * Chosen to span both audiences, because the opening turn does not yet know
 * whether it is talking to a homeowner or a facilities manager.
 *
 * When this becomes model-backed, `docs/chat-knowledge-base.md` is the grounding
 * document, and the same rule carries over: quote the source or say you do not
 * know and offer the phone number.
 */
export const QUICK_QUESTIONS: readonly string[] = [
  'Which areas of Melbourne do you cover?',
  'What actually drives the price of a house repaint?',
  'Do I need to move out?',
  'Can you work outside our operating hours?',
  'Will you attend site before quoting?',
] as const;

export type QuickAnswer = {
  question: string;
  /** The published answer, unedited. */
  answer: string;
};

export const QUICK_ANSWERS: readonly QuickAnswer[] = QUICK_QUESTIONS.map((question) => {
  const published = faqs.find((faq) => faq.question === question);

  // Fails the build rather than shipping a chat that answers from nowhere.
  if (!published) {
    throw new Error(
      `Quick question "${question}" is not published in content/faqs.ts. ` +
        'The chat may only quote answers the site already makes.',
    );
  }

  return { question: published.question, answer: published.answer };
});
