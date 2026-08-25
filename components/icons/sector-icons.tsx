/**
 * Sector glyphs.
 *
 * The sector cards are eight blocks of near-identical text, and at a glance
 * they were indistinguishable — the reader had to actually read a heading to
 * know which card they were on. A glyph makes the card scannable and gives the
 * grid a rhythm the photographs on the service cards give that grid.
 *
 * Drawn, not photographed, on purpose. There is a real project photograph for
 * three of these eight sectors and none for the rest, and a stock photo of a
 * building we did not paint is a claim we cannot make. A line glyph says
 * "aged care" without asserting anything about a job.
 *
 * Every icon is a list of path data on one 24x24 grid with one shared stroke
 * treatment, so the set cannot drift apart: a new sector adds `d` strings, not
 * a new component with its own stroke width and cap style.
 */

/** Path data per sector slug. Keys match `Sector['slug']` in content/sectors.ts. */
export const SECTOR_ICON_PATHS: Readonly<Record<string, readonly string[]>> = {
  // Mortarboard.
  'education-and-childcare': [
    'M2.5 9 12 4.5 21.5 9 12 13.5Z',
    'M6.5 11.2v5.1s2.2 2.2 5.5 2.2 5.5-2.2 5.5-2.2v-5.1',
    'M21.5 9v5.5',
  ],
  // Cross in a rounded square.
  healthcare: [
    'M6 3.5h12A2.5 2.5 0 0 1 20.5 6v12a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V6A2.5 2.5 0 0 1 6 3.5Z',
    'M12 8v8',
    'M8 12h8',
  ],
  // Heart under a roof — a home, and care in it.
  'aged-care-and-retirement': [
    'M3 10.8 12 4l9 6.8',
    'M5.5 9.9V20.5h13V9.9',
    'M12 18c-2.6-1.9-3.6-3.1-3.6-4.4a1.9 1.9 0 0 1 3.6-1 1.9 1.9 0 0 1 3.6 1c0 1.3-1 2.5-3.6 4.4Z',
  ],
  // Two towers.
  'body-corporate-and-strata': [
    'M3.5 20.5V8.6L10 5.4v15.1',
    'M10 11h10.5v9.5',
    'M2 20.5h20',
    'M6 11h1.5M6 14h1.5M6 17h1.5M13.5 14H15M17 14h1.5M13.5 17H15M17 17h1.5',
  ],
  // Shopfront under an awning.
  retail: ['M3.5 9.5 5 5.5h14l1.5 4Z', 'M5 9.5v11h14v-11', 'M9.5 20.5v-6h5v6', 'M2.5 20.5h19'],
  // Cup and saucer.
  hospitality: [
    'M4.5 9.5h12v4.2a6 6 0 0 1-12 0Z',
    'M16.5 11h1.6a2.4 2.4 0 0 1 0 4.8h-1.6',
    'M3.5 20.5h14',
    'M8.5 6.5c0-1 1-1.3 1-2.3M12.5 6.5c0-1 1-1.3 1-2.3',
  ],
  // A marked-out court.
  'leisure-and-sports': [
    'M4 5h16a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4 5Z',
    'M12 5v14',
    'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    'M2.5 9h3v6h-3M21.5 9h-3v6h3',
  ],
  // Sawtooth roof and stack.
  industrial: [
    'M2.5 20.5v-9l5.5 3.2v-3.2l5.5 3.2v-3.2l5.5 3.2v9',
    'M19 11.7V4.5h2.5v16',
    'M1.5 20.5h21',
    'M7 20.5v-3h3v3',
  ],
};

/**
 * One sector glyph.
 *
 * Decorative: the sector name is always right beside it, so announcing the
 * icon would just repeat the heading to a screen reader.
 */
export function SectorIcon({ slug, className }: { slug: string; className?: string }) {
  const paths = SECTOR_ICON_PATHS[slug];
  if (!paths) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
