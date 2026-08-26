import { expect, test, type Page } from '@playwright/test';

/**
 * Wayfinding: knowing where you are, and seeing yourself get somewhere else.
 *
 * Two things a visitor moving through a twenty-page site relies on and never
 * names — the menu marking the page they are standing on, and the page change
 * reading as one movement rather than a flash.
 */

/**
 * The main navigation that is actually on screen at this viewport.
 *
 * There are two in the markup — the desktop bar and the drawer — and only one
 * is ever in the accessibility tree, which is what `getByRole` walks.
 */
function mainNav(page: Page) {
  return page.getByRole('navigation', { name: 'Main' });
}

test.describe('current page marking', () => {
  test('the menu marks the page you are on', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The desktop bar is the always-visible menu; the drawer is tested below.');

    await page.goto('/commercial/');
    await expect(mainNav(page).locator('[aria-current="page"]')).toHaveText(/Commercial/);
  });

  test('a sector page marks itself, not its section, as the current page', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop dropdown.');

    // /office-painters/ sits under Commercial in the menu but not in the URL.
    await page.goto('/office-painters/');
    const nav = mainNav(page);

    // Commercial is styled as the section but must not claim to be the page.
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(0);

    await nav.getByRole('button', { name: /^Commercial/ }).click();
    await expect(nav.locator('[aria-current="page"]')).toHaveText(/Office painting/);
  });

  test('only one thing in the menu is ever the current page', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop dropdown.');

    // The Commercial dropdown holds an "Overview" link onto this same page as
    // the trigger. Only one may claim to be it.
    await page.goto('/commercial/');
    const nav = mainNav(page);
    await nav.getByRole('button', { name: /^Commercial/ }).click();
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  });

  test('the drawer opens with your section already unfolded and marked', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Mobile drawer only renders below the lg breakpoint.');

    await page.goto('/office-painters/');
    await page.getByRole('button', { name: /^menu$/i }).click();

    const drawer = page.getByRole('dialog', { name: 'Site menu' });
    // Unfolded without being asked, because that is where this page lives.
    await expect(page.getByRole('button', { name: /collapse commercial links/i })).toBeVisible();
    await expect(drawer.locator('[aria-current="page"]')).toHaveText(/Office painting/);
  });

  test('the footer marks the current page too', async ({ page }) => {
    await page.goto('/about-us/');
    const current = page.locator('footer [aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText('About us');
  });
});

test.describe('page transitions', () => {
  test('a page change is animated, not flashed', async ({ page }) => {
    await page.addInitScript(() => {
      const doc = document as Document & {
        startViewTransition?: (...args: unknown[]) => unknown;
      };
      const win = window as Window & { __viewTransitions?: number };
      win.__viewTransitions = 0;
      const original = doc.startViewTransition?.bind(doc);
      if (!original) return;
      doc.startViewTransition = (...args: unknown[]) => {
        win.__viewTransitions = (win.__viewTransitions ?? 0) + 1;
        return original(...args);
      };
    });

    await page.goto('/');
    // A footer link, so this runs identically at both viewports.
    await page.locator('footer').getByRole('link', { name: 'About us' }).click();
    await expect(page).toHaveURL(/\/about-us\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const count = await page.evaluate(
      () => (window as Window & { __viewTransitions?: number }).__viewTransitions ?? 0,
    );
    // Non-zero also proves the navigation stayed client-side: a full reload
    // would have reset the counter along with the page.
    expect(count).toBeGreaterThan(0);
  });

  test('navigation still works with motion switched off', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/projects\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('deep links into /areas/', () => {
  test('breadcrumb, one h1 and Service Areas marking hold from the hub down to a suburb', async ({
    page,
    isMobile,
  }) => {
    // Service Areas is only ever marked in the accessibility tree by the
    // desktop bar: on mobile it is either hidden (nav collapsed) or lives in
    // the drawer, which only exists in the DOM while open. The drawer's own
    // marking is covered above ("the drawer opens with your section already
    // unfolded and marked").
    test.skip(isMobile, 'Desktop bar only.');

    const nav = mainNav(page);

    // Areas -> Victoria -> Eastern -> Vermont. The first level is the page
    // itself; every level below it is a URL descendant, so Service Areas
    // switches from "this is the page" to "this is the section" exactly once,
    // on the way down, and never switches back.
    const levels: { path: string; navState: 'page' | 'section' }[] = [
      { path: '/areas/', navState: 'page' },
      { path: '/areas/victoria/', navState: 'section' },
      { path: '/areas/victoria/eastern/', navState: 'section' },
      { path: '/areas/victoria/eastern/vermont/', navState: 'section' },
    ];

    for (const { path, navState } of levels) {
      await test.step(path, async () => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);

        // The breadcrumb trail is the only landmark rendered inside <main> on
        // these pages — the header, the main nav and the drawer all live
        // outside it — so asserting it is first proves it opens the content
        // rather than trailing the hero underneath it.
        const main = page.locator('#main');
        const firstLandmark = main.locator('nav, header, aside').first();
        await expect(firstLandmark).toHaveAttribute('aria-label', 'Breadcrumb');

        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

        const button = nav.getByRole('button', { name: /^Service Areas/ });
        if (navState === 'page') {
          await expect(button).toHaveAttribute('aria-current', 'page');
        } else {
          // A section is styled the same way a current page is (the
          // `text-brand-700` trigger colour) but never carries
          // `aria-current` — only one thing in the menu may claim to be the
          // page itself (components/navigation/desktop-nav.tsx).
          await expect(button).not.toHaveAttribute('aria-current', 'page');
          await expect(button).toHaveClass(/text-brand-700/);
        }
      });
    }
  });

  test('a Queensland Tier 3 suburb page renders and is noindex', async ({ page }) => {
    const response = await page.goto('/areas/queensland/gold-coast/molendinar/');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    /*
     * What makes this page noindex is `locality.indexable`, which is
     * false for every Queensland locality while `qldPresence` is false — and
     * that half of the claim is already checked directly in
     * tests/unit/content-integrity.test.ts ("no Queensland
     * locality is indexable while qldPresence is false") and
     * tests/unit/locations-tiers.test.ts. What those unit tests cannot cover
     * is whether the computed value actually reaches the rendered page, which
     * is the integration concern this assertion exists for.
     */
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});
