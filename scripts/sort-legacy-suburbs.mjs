#!/usr/bin/env node
/**
 * Sort the 68 legacy suburb pages into keep / consolidate / noindex / redirect.
 *
 * The rebuild reduced 68 WordPress suburb pages to a representative subset in
 * content/locations.ts, on the rule that a suburb page is only indexable when
 * it carries genuine unique value. That rule is right, but applying it to all
 * 68 by hand is guesswork without traffic data — and a page earning long-tail
 * clicks is worth keeping even when the copy is thin, because you can fix copy
 * and you cannot get rankings back.
 *
 * This script applies the rule against real Search Console data instead.
 *
 * USAGE
 *   1. Search Console → Performance → Pages. Set the date range to the last
 *      16 months. Filter Page → contains → /areas/. Export as CSV.
 *   2. node scripts/sort-legacy-suburbs.mjs <export.csv>
 *
 * The CSV needs a page/URL column and, ideally, clicks and impressions
 * columns. Column names are matched case-insensitively so both the English
 * export ("Top pages", "Clicks", "Impressions") and the API's snake_case work.
 *
 * OUTPUT
 *   A table on stdout plus suburb-decisions.csv next to the input, with a
 *   recommendation and the reason for each URL. Nothing is written to
 *   content/locations.ts — the decisions are for review, not for automatic
 *   application.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

/* --------------------------------------------------------------- Thresholds */

/**
 * Deliberately conservative. The asymmetry matters: wrongly keeping a weak page
 * costs a little crawl budget, wrongly killing a ranking page costs traffic
 * that takes months to earn back. When in doubt this keeps.
 */
const THRESHOLDS = {
  /** Any clicks at all over 16 months means a real person arrived. Keep. */
  keepClicks: 1,
  /** Impressions without clicks means Google ranks it but nobody picks it. */
  consolidateImpressions: 50,
  /** Below this, the page is invisible and carries no evidence. Noindex. */
  noindexImpressions: 50,
};

/* -------------------------------------------------------------- CSV parsing */

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function columnIndex(header, candidates) {
  const lower = header.map((h) => h.trim().toLowerCase());
  for (const candidate of candidates) {
    const i = lower.indexOf(candidate);
    if (i !== -1) return i;
  }
  // fall back to a substring match, so "Top pages" finds "page"
  for (const candidate of candidates) {
    const i = lower.findIndex((h) => h.includes(candidate));
    if (i !== -1) return i;
  }
  return -1;
}

function toNumber(value) {
  if (value === undefined) return 0;
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/* ------------------------------------------------------- Slug normalisation */

/**
 * The legacy set contains three defective slugs the rebuild corrected:
 * park-dale duplicates parkdale, travencore misspells Travancore, garden-vale
 * misspells Gardenvale. Those redirect rather than being judged on their own
 * data, and their metrics belong to the survivor.
 */
const CORRECTIONS = new Map([
  ['painters-park-dale', 'painters-parkdale'],
  ['painters-travencore', 'painters-travancore'],
  ['painters-garden-vale', 'painters-gardenvale'],
]);

function slugFromUrl(url) {
  const match = String(url).match(/\/areas\/([^/?#]+)/);
  return match ? match[1] : null;
}

/* ---------------------------------------------------------------- Decisions */

function decide({ clicks, impressions, corrected }) {
  if (corrected) {
    return {
      action: 'redirect',
      reason: `Defective slug. 301 to /areas/${corrected}/ and fold its metrics into that page.`,
    };
  }
  if (clicks >= THRESHOLDS.keepClicks) {
    return {
      action: 'keep',
      reason: `${clicks} click${clicks === 1 ? '' : 's'} over the period. Real arrivals — keep the URL and improve the copy rather than removing it.`,
    };
  }
  if (impressions >= THRESHOLDS.consolidateImpressions) {
    return {
      action: 'consolidate',
      reason: `${impressions} impressions but no clicks. Google ranks it and nobody chooses it — fold into a regional page and 301, keeping the demand.`,
    };
  }
  return {
    action: 'noindex',
    reason: `${impressions} impressions, no clicks. Invisible and carrying no evidence. Noindex until a documented project exists in the suburb.`,
  };
}

const ORDER = { keep: 0, consolidate: 1, redirect: 2, noindex: 3 };

/* --------------------------------------------------------------------- Main */

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/sort-legacy-suburbs.mjs <search-console-export.csv>');
  console.error('');
  console.error('Search Console → Performance → Pages, last 16 months,');
  console.error('filter Page contains /areas/, then Export → CSV.');
  process.exit(1);
}

let rows;
try {
  rows = parseCsv(readFileSync(input, 'utf8'));
} catch (error) {
  console.error(`Could not read ${input}: ${error.message}`);
  process.exit(1);
}

if (rows.length < 2) {
  console.error('That file has no data rows.');
  process.exit(1);
}

const header = rows[0];
const pageCol = columnIndex(header, ['page', 'url', 'top pages', 'landing page']);
const clickCol = columnIndex(header, ['clicks', 'click']);
const imprCol = columnIndex(header, ['impressions', 'impression']);

if (pageCol === -1) {
  console.error(`No page/URL column found. Header was: ${header.join(', ')}`);
  process.exit(1);
}
if (clickCol === -1 || imprCol === -1) {
  console.error('Warning: no clicks and/or impressions column found.');
  console.error('Every row will be treated as zero, which sorts everything to noindex.');
  console.error('Export from the Performance report with both metrics enabled.');
}

const seen = new Map();
for (const row of rows.slice(1)) {
  const slug = slugFromUrl(row[pageCol]);
  if (!slug) continue;
  const corrected = CORRECTIONS.get(slug) ?? null;
  const existing = seen.get(slug);
  const clicks = toNumber(row[clickCol]);
  const impressions = toNumber(row[imprCol]);
  if (existing) {
    existing.clicks += clicks;
    existing.impressions += impressions;
  } else {
    seen.set(slug, { slug, clicks, impressions, corrected, url: row[pageCol] });
  }
}

const decisions = [...seen.values()]
  .map((entry) => ({ ...entry, ...decide(entry) }))
  .sort(
    (a, b) => ORDER[a.action] - ORDER[b.action] || b.clicks - a.clicks || b.impressions - a.impressions,
  );

const counts = decisions.reduce((acc, d) => ({ ...acc, [d.action]: (acc[d.action] ?? 0) + 1 }), {});

console.log(`\n${decisions.length} suburb URLs found in ${basename(input)}\n`);
console.log(
  `${'ACTION'.padEnd(13)}${'SLUG'.padEnd(34)}${'CLICKS'.padStart(7)}${'IMPR'.padStart(8)}`,
);
console.log('-'.repeat(62));
for (const d of decisions) {
  console.log(
    `${d.action.padEnd(13)}${d.slug.slice(0, 33).padEnd(34)}${String(d.clicks).padStart(7)}${String(d.impressions).padStart(8)}`,
  );
}

console.log('\nSummary');
for (const action of ['keep', 'consolidate', 'redirect', 'noindex']) {
  console.log(`  ${action.padEnd(13)} ${counts[action] ?? 0}`);
}

const outPath = join(dirname(input), 'suburb-decisions.csv');
const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
writeFileSync(
  outPath,
  [
    'slug,url,clicks,impressions,action,reason',
    ...decisions.map((d) =>
      [d.slug, d.url, d.clicks, d.impressions, d.action, d.reason].map(escape).join(','),
    ),
  ].join('\n'),
  'utf8',
);

console.log(`\nWritten to ${outPath}`);
console.log('Review it before touching content/locations.ts. Nothing here is applied automatically.');
