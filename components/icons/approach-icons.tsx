/**
 * Approach glyphs.
 *
 * The "how we work" grid is six cards of equal weight and near-identical
 * shape, and like the sector cards it gave the reader nothing to aim at — the
 * only way to find "access" was to read all six headings. A glyph turns the
 * grid into something you can scan.
 *
 * Same rules as components/icons/sector-icons: drawn rather than photographed,
 * one 24x24 grid, one shared stroke treatment applied by the component, so a
 * seventh item adds `d` strings rather than a second icon style. Six distinct
 * silhouettes on purpose — a lens, a dial, a brush, a ladder, a page, a bar
 * chart — because six variations on the same shape would be no more scannable
 * than six headings.
 */

/** Path data per approach item. Keys are referenced from the page content. */
export const APPROACH_ICON_PATHS = {
  // Magnifier over a building elevation — the site visit before the quote.
  'site-visit': [
    'M4 20.5V6.6A1.6 1.6 0 0 1 5.6 5h5.8A1.6 1.6 0 0 1 13 6.6v13.9',
    'M6.8 9h3.4M6.8 12.5h3.4M6.8 16h3.4',
    'M2 20.5h20',
    'M21.2 10.2a3.6 3.6 0 1 1-7.2 0 3.6 3.6 0 0 1 7.2 0Z',
    'm20.2 12.8 1.6 1.6',
  ],
  // A clock — staged work and out-of-hours access.
  scheduling: [
    'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    'M12 7v5l3.4 2',
    'M12 4v1.4M12 18.6V20M20 12h-1.4M5.4 12H4',
  ],
  // Brush over a surface — preparation before anything is specified.
  'surface-prep': [
    'M10 6.5V5a1.2 1.2 0 0 1 1.2-1.2h1.6A1.2 1.2 0 0 1 14 5v1.5',
    'M5.5 6.5h13a1 1 0 0 1 1 1v3.2h-15V7.5a1 1 0 0 1 1-1Z',
    'M6.5 10.7v3.8M10 10.7v3.8M13.5 10.7v3.8M17 10.7v3.8',
    'M3 15.5h18',
  ],
  // Ladder against a wall — access chosen per elevation, not site-wide.
  access: [
    'M17.5 3.5v17',
    'M2.5 20.5h19',
    'M6.5 20.5 13 4',
    'M10.5 20.5 17 4',
    'M7.8 17.2h4M9.1 13.9h4M10.4 10.6h4M11.7 7.3h4',
  ],
  // A page of line items closing on a total, rather than one number.
  'itemised-quote': [
    'M6.5 3h7.6L18.5 7.4V21H6.5z',
    'M14.1 3v4.4h4.4',
    'M9 11.6h3.4M14.8 11.6h1.7',
    'M9 14.6h3.4M14.8 14.6h1.7',
    'M9 17.8h7.5',
  ],
  // Overlapping bars on one axis — several trades, one programme.
  'one-programme': ['M3.5 3.8v16.7h17', 'M6.5 7.3h6.5', 'M9.5 12h8', 'M7 16.6h7'],
} as const satisfies Record<string, readonly string[]>;

export type ApproachIconName = keyof typeof APPROACH_ICON_PATHS;

/**
 * One approach glyph.
 *
 * Decorative: the heading it belongs to is always directly beside it, so
 * announcing the icon would only repeat that heading to a screen reader.
 */
export function ApproachIcon({ name, className }: { name: ApproachIconName; className?: string }) {
  const paths = APPROACH_ICON_PATHS[name];
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
