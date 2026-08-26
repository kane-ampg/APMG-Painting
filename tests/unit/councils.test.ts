import { describe, expect, it } from 'vitest';
import { COUNCILS, getCouncil } from '@/content/councils';
import { FORBIDDEN } from './qld-copy.test';

/**
 * Council notes.
 *
 * Two editorial rules from spec §6, both testable:
 *
 * 1. No claimed presence in Queensland. APMG has no Queensland address,
 *    projects or phone number, so a QLD note may describe the place and how
 *    work is scoped there but never a footprint in it. The phrase list this
 *    checks against is `FORBIDDEN`, imported from tests/unit/qld-copy.test.ts
 *    rather than duplicated here — one list, one place to strengthen.
 * 2. Real writing, not a filled-in template. A note short enough to be a
 *    label is not differentiation.
 */

describe('COUNCILS', () => {
  it('holds 45 councils', () => {
    expect(COUNCILS).toHaveLength(45);
  });

  it('has no duplicate names', () => {
    const names = COUNCILS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('resolves by exact name and rejects an unknown one', () => {
    expect(getCouncil('Brisbane')?.state).toBe('QLD');
    expect(getCouncil('Maroondah')?.state).toBe('VIC');
    expect(getCouncil('Not A Council')).toBeUndefined();
  });
});

describe('every council carries real writing', () => {
  it.each(COUNCILS.map((c) => [c.name, c] as const))('%s', (_name, council) => {
    expect(council.buildingStock.length).toBeGreaterThan(80);
    expect(council.note.length).toBeGreaterThan(120);
    expect(council.buildingStock).not.toBe(council.note);
  });
});

describe('no Queensland council note claims a presence', () => {
  it.each(COUNCILS.filter((c) => c.state === 'QLD').map((c) => [c.name, c] as const))(
    '%s',
    (name, council) => {
      const text = `${council.buildingStock} ${council.note}`.toLowerCase();
      for (const claim of FORBIDDEN) {
        expect(text, `${name} claims "${claim}"`).not.toContain(claim);
      }
    },
  );
});
