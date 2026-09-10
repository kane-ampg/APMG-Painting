import { describe, expect, it } from 'vitest';
import { brand } from '@/lib/site';

/**
 * The brand statements come from the 2025 APMG Services brand guide
 * (docs/superpowers/specs/Brand Guide Web Developers.pdf). They are quoted
 * rather than paraphrased wherever the site's positioning allows it.
 */
describe('brand statements', () => {
  it('names the four core values from the guide, in the guide order', () => {
    expect(brand.values.map((v) => v.name)).toEqual([
      'Expertise',
      'Passion',
      'Professionalism',
      'Integrity',
    ]);
  });

  it('carries the vision statement verbatim', () => {
    expect(brand.vision).toBe(
      'To be the most trusted and versatile property maintenance partner, setting the benchmark for quality, reliability, and customer care across every trade we deliver.',
    );
  });

  it('keeps the mission inside the commercial positioning', () => {
    // The guide's mission names "industrial, commercial, and residential"
    // clients. This site is the commercial business, so the mission is carried
    // without the client-type clause rather than with a claim the site does not
    // otherwise make.
    expect(brand.mission).toMatch(/^At APMG/);
    expect(brand.mission).toMatch(/simplify property maintenance/);
    expect(brand.mission).not.toMatch(/residential|homeowner/i);
  });

  it('states the alternate names the guide uses for the group', () => {
    expect(brand.alternateNames).toContain('APMG Services');
    expect(brand.descriptor).toBe('Australian Property Maintenance Group');
  });
});
