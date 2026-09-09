import { describe, expect, it } from 'vitest';
import config from '../../next.config';
import { allLocalities } from '@/lib/locations';

type Redirect = { source: string; destination: string; permanent?: boolean };

async function redirects(): Promise<Redirect[]> {
  return ((await config.redirects?.()) ?? []) as Redirect[];
}

/**
 * The legacy table only. `next.config.ts` also emits the role-based
 * `/admin/*` redirect that keeps the public site and the editor deployment in
 * their own lanes (spec §8a); that one is deliberately temporary and is not
 * part of the migration map these assertions guard.
 */
async function legacyRedirects(): Promise<Redirect[]> {
  return (await redirects()).filter((r) => r.source.startsWith('/areas/'));
}

/**
 * Legacy suburb URLs.
 *
 * Every /areas/painters-{suburb}/ on the live WordPress site must land on a
 * real page. These are indexed URLs with accumulated equity; a 404 throws it
 * away, and there is no getting it back.
 */

describe('legacy suburb redirects', () => {
  it('emits one per VIC locality plus the three defect corrections, not one per locality overall, because the generated table is Victoria-only', async () => {
    const vicLocalityCount = allLocalities().filter((l) => l.state === 'VIC').length;
    const all = await legacyRedirects();
    expect(all.length).toBe(vicLocalityCount + 3);
  });

  it('sends every legacy path to a real /areas/ page', async () => {
    const real = new Set(allLocalities().map((l) => l.href));
    const legacy = (await redirects()).filter((r) => r.source.includes('painters-'));

    for (const redirect of legacy) {
      const destination = redirect.destination.endsWith('/')
        ? redirect.destination
        : `${redirect.destination}/`;
      expect(real, `${redirect.source} -> ${redirect.destination}`).toContain(destination);
    }
  });

  it('keeps the three known defect corrections working', async () => {
    const all = await redirects();
    for (const broken of ['park-dale', 'travencore', 'garden-vale']) {
      const entry = all.find((r) => r.source.includes(broken));
      expect(entry, broken).toBeDefined();
      expect(entry?.permanent).toBe(true);
    }
  });

  it('redirects the four suburbs that had a page on the old site', async () => {
    const all = await redirects();
    for (const slug of ['vermont', 'brighton', 'parkdale', 'travancore']) {
      const entry = all.find((r) => r.source === `/areas/painters-${slug}`);
      expect(entry, slug).toBeDefined();
      expect(entry?.destination).toMatch(/^\/areas\/victoria\//);
    }
  });

  it('never redirects a path onto itself', async () => {
    for (const redirect of await redirects()) {
      expect(redirect.source).not.toBe(redirect.destination);
    }
  });

  it('marks every redirect permanent', async () => {
    for (const redirect of await legacyRedirects()) {
      expect(redirect.permanent, redirect.source).toBe(true);
    }
  });
});
