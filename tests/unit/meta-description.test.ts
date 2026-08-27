import { describe, expect, it } from 'vitest';
import { metaDescription } from '@/lib/seo/metadata';

/**
 * Meta descriptions generated from longer prose used to be a naive
 * `.slice(0, 155)`, which shipped SERP snippets ending mid-word — Vermont's
 * ended "…school stayed open. Vermo". The helper cuts at the last full
 * sentence that fits; when no full sentence fits, it cuts at a word boundary
 * and says so with an ellipsis.
 */
describe('metaDescription', () => {
  it('returns text that already fits, unchanged', () => {
    expect(metaDescription('Short and complete.')).toBe('Short and complete.');
  });

  it('cuts at the last sentence boundary that fits', () => {
    const text =
      'APMG Painting completed a full interior and exterior repaint at Emmaus College in Vermont, working across a live campus while the school stayed open. Vermont sits in Melbourne’s eastern suburbs, roughly ten minutes from our Bayswater North base.';
    const result = metaDescription(text);
    expect(result).toBe(
      'APMG Painting completed a full interior and exterior repaint at Emmaus College in Vermont, working across a live campus while the school stayed open.',
    );
  });

  it('never cuts mid-word when no sentence boundary fits', () => {
    const text = `One very long opening sentence ${'that keeps going and going '.repeat(10)}without ever ending`;
    const result = metaDescription(text);
    expect(result.length).toBeLessThanOrEqual(155);
    expect(result.endsWith('…')).toBe(true);
    // The character before the ellipsis is the end of a whole word.
    expect(result.at(-2)).toMatch(/\S/);
    expect(text.startsWith(result.slice(0, -1))).toBe(true);
  });

  it('never exceeds the limit', () => {
    const text = `${'A sentence. '.repeat(40)}`;
    expect(metaDescription(text).length).toBeLessThanOrEqual(155);
  });

  it('never exceeds the limit even with no space to break on', () => {
    expect(metaDescription('x'.repeat(400)).length).toBeLessThanOrEqual(155);
  });
});
