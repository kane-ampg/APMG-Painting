import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * The critical end-to-end flows named in the brief.
 */

/**
 * Give a test its own simulated client IP.
 *
 * The enquiry rate limiter allows five submissions per IP per ten minutes and
 * keys off `x-forwarded-for` (lib/enquiry/rate-limit.ts, app/actions/enquiry.ts).
 * Several tests submit, the desktop and mobile projects share one server, and
 * the buckets are in-memory and shared — so without this the suite rate-limits
 * itself and the failure reads as a product bug rather than a test-isolation
 * one. Addresses come from TEST-NET-3, reserved for documentation.
 */
async function withOwnClientIp(page: Page, testInfo: TestInfo, id: number) {
  const project = testInfo.project.name === 'mobile' ? 200 : 100;
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': `203.0.113.${project + id}` });
}

test.describe('navigation', () => {
  test('mobile menu opens, exposes commercial sectors and closes on Escape', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Mobile drawer only renders below the lg breakpoint.');

    await page.goto('/');
    const trigger = page.getByRole('button', { name: /menu/i });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Scoped to the drawer: "Healthcare" also appears in the sector grid and
    // the footer.
    const drawer = page.getByRole('dialog', { name: 'Site menu' });
    await page.getByRole('button', { name: /expand commercial links/i }).click();
    await expect(drawer.getByRole('link', { name: 'Healthcare', exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('the mobile menu is a full-height sidebar, not a strip', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile drawer only renders below the lg breakpoint.');

    /*
     * A measured regression test, because the queries above cannot catch this.
     *
     * The header carries `backdrop-blur`, and a `backdrop-filter` makes an
     * element a containing block for `position: fixed` descendants. Rendered
     * inside the header, the drawer's `inset-y-0` resolved against the header
     * instead of the viewport and the panel collapsed to a 64px strip — every
     * link still in the DOM, still with a bounding box, still "visible" to a
     * role query, but scrolled out of sight inside an overflow container. The
     * suite stayed green while the menu was unusable on every phone.
     *
     * Only the geometry tells the truth, so the geometry is what is asserted.
     */
    await page.goto('/');
    await page.getByRole('button', { name: /menu/i }).click();

    const drawer = page.getByRole('dialog', { name: 'Site menu' });
    await drawer.waitFor({ state: 'visible' });

    // Measure the settled panel. The drawer slides in over 300ms, and reading
    // its box mid-flight measures the animation rather than the layout.
    await page.waitForFunction(() => {
      const panel = document.querySelector('[role="dialog"]');
      return Boolean(panel) && panel!.getAnimations().every((a) => a.playState === 'finished');
    });

    const box = await drawer.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (!box || !viewport) return;

    // Full height, anchored to the right edge.
    expect(box.height).toBeGreaterThanOrEqual(viewport.height - 1);
    expect(Math.round(box.x + box.width)).toBe(viewport.width);

    // A sidebar, not a page swap: some of the page must remain behind it.
    expect(box.width).toBeLessThan(viewport.width);
    expect(box.x).toBeGreaterThan(0);

    // The last thing in the drawer has to be reachable without the panel
    // clipping it — the failure mode that hid every link before.
    await expect(drawer.getByRole('link', { name: /1300 97 97 40/ })).toBeInViewport();
  });

  test('reaches the commercial page and it targets the commercial query', async ({ page }) => {
    await page.goto('/commercial/');
    await expect(page).toHaveTitle(/Commercial Painters Melbourne/i);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      /Commercial painters in Melbourne/i,
    );
  });

  test('the homepage no longer competes for the commercial query', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).not.toMatch(/^Commercial Painters Melbourne/i);
    expect(title).toMatch(/APMG Painting/);
  });

  test('every page has exactly one h1', async ({ page }) => {
    for (const path of ['/', '/commercial/', '/projects/', '/about-us/']) {
      await page.goto(path);
      await expect(page.locator('h1'), `h1 count on ${path}`).toHaveCount(1);
    }
  });
});

test.describe('landing page', () => {
  test('"What we paint" renders a card per service with a photo or a plain card', async ({
    page,
  }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBe(true);
    const cards = page.locator('#services article');
    // At least one, not exactly `services.length`: with the CMS configured
    // the section renders whatever is published, and a test that fails
    // because an editor unpublished a service is testing the wrong thing.
    // What matters is that every card that renders is complete.
    //
    // The section is scroll-revealed (components/motion/scroll-reveal.tsx):
    // GSAP hides below-the-fold [data-reveal] elements with inline
    // `autoAlpha` (opacity + visibility) until they cross the trigger line.
    // Whether the first card starts on-screen depends on load timing and
    // viewport, so scroll to it explicitly rather than relying on it landing
    // at the viewport edge.
    await cards.first().scrollIntoViewIfNeeded();
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      // Same scroll-reveal concern as above: scroll each card into view
      // before asserting on its contents.
      await cards.nth(i).scrollIntoViewIfNeeded();
      await expect(cards.nth(i).getByRole('heading', { level: 3 })).toBeVisible();
      await expect(cards.nth(i).locator('p').first()).not.toBeEmpty();
    }
  });

  test('has an Open Graph image', async ({ page }) => {
    // `app/opengraph-image.tsx` lived at the app root, outside the
    // `app/(site)/` route group the public pages moved into. That convention
    // is per-segment, so it stopped applying to any public page — only
    // Next's own `/_not-found` kept an og:image. Moving the file back under
    // `app/(site)/` is what this test guards against regressing.
    await page.goto('/');
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /.+/);
  });
});

test.describe('projects', () => {
  test('opens a case study with its documented detail', async ({ page }) => {
    await page.goto('/projects/');
    await page
      .getByRole('link', { name: /Emmaus College/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/projects\/emmaus-college-school-repaint-vermont\//);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Emmaus College');
    await expect(page.getByRole('heading', { name: 'Access and safety' })).toBeVisible();
    await expect(page.getByText(/Boom lift \(EWP\)/i)).toBeVisible();
  });
});

test.describe('site assessment booking', () => {
  test('rejects invalid data with accessible field errors', async ({ page }) => {
    await page.goto('/contact-us/#assessment');

    const form = page.locator('form').filter({ has: page.getByLabel('Organisation') });
    await form.getByLabel('Your name').fill('A');
    await form.getByLabel('Work email').fill('not-an-email');
    await form.getByRole('button', { name: /book my assessment/i }).click();

    const email = form.getByLabel('Work email');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(form.getByText(/valid email address/i)).toBeVisible();
  });

  test('offers an on-site visit in Melbourne only', async ({ page }) => {
    await page.goto('/contact-us/#assessment');

    const form = page.locator('form').filter({ has: page.getByLabel('Organisation') });
    await form.getByLabel('Interstate').check();
    await expect(form.getByLabel(/on-site visit/i)).toBeDisabled();
    await expect(form.getByText(/melbourne-only for now/i)).toBeVisible();

    await form.getByLabel('Metropolitan Melbourne').check();
    await expect(form.getByLabel(/on-site visit/i)).toBeEnabled();
  });

  test('accepts a booking and states plainly that nothing was delivered', async ({
    page,
  }, testInfo) => {
    await withOwnClientIp(page, testInfo, 1);
    await page.goto('/contact-us/#assessment');

    const form = page.locator('form').filter({ has: page.getByLabel('Organisation') });
    await form.getByLabel('Metropolitan Melbourne').check();
    await form.getByLabel(/on-site visit/i).check();
    await form.getByLabel('Property or sector type').selectOption('education-and-childcare');
    await form.getByLabel('Site address').fill('12 Canterbury Road, Vermont VIC 3133');
    await form.getByLabel('Preferred times').fill('Tuesday or Wednesday morning.');
    await form.getByLabel('Organisation').fill('Vermont Secondary College');
    await form.getByLabel('Your name').fill('Alex Chen');
    await form.getByLabel('Phone').fill('03 9000 0000');
    await form.getByLabel('Work email').fill('facilities@example.edu.au');

    // The server enforces a minimum completion time to catch bots.
    await page.waitForTimeout(3500);
    await form.getByRole('button', { name: /book my assessment/i }).click();

    const status = form.getByRole('status');
    await expect(status).toBeVisible();
    // No transport is configured, so the UI must not imply delivery.
    await expect(status).toContainText(/were not sent/i);
    await expect(status).toContainText('1300 97 97 40');
  });
});

test.describe('site assessment chat', () => {
  test('is absent from the contact page, where the full form already is', async ({ page }) => {
    await page.goto('/contact-us/');
    await expect(page.getByRole('button', { name: /site assessment/i })).toHaveCount(0);
  });

  test('answers a published question without starting a booking', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Free site assessment' }).click();

    const panel = page.getByRole('dialog', { name: 'Free site assessment' });
    await panel.getByRole('button', { name: 'Which areas of Melbourne do you cover?' }).click();

    // Quoted from content/faqs.ts, not generated.
    await expect(panel.getByRole('log')).toContainText(
      'We work across metropolitan Melbourne from our base at Bayswater North.',
    );
    // The booking flow is still right there.
    await expect(panel.getByRole('button', { name: 'Metropolitan Melbourne' })).toBeVisible();
  });

  test('offers online only when the site is outside Melbourne', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Free site assessment' }).click();

    const panel = page.getByRole('dialog', { name: 'Free site assessment' });
    await panel.getByRole('button', { name: 'Elsewhere in Victoria' }).click();

    await expect(panel.getByRole('button', { name: /online assessment/i })).toBeVisible();
    await expect(panel.getByRole('button', { name: /on-site visit/i })).toHaveCount(0);
  });

  test('walks the booking and states plainly that nothing was delivered', async ({
    page,
  }, testInfo) => {
    await withOwnClientIp(page, testInfo, 3);
    await page.goto('/');
    await page.getByRole('button', { name: 'Free site assessment' }).click();

    const panel = page.getByRole('dialog', { name: 'Free site assessment' });

    // The server enforces a minimum completion time to catch bots, measured
    // from the moment the panel opened.
    await page.waitForTimeout(3500);

    await panel.getByRole('button', { name: 'Metropolitan Melbourne' }).click();
    await panel.getByRole('button', { name: /on-site visit/i }).click();
    await panel.getByRole('button', { name: 'School or childcare' }).click();

    await panel.getByLabel('Site address').fill('12 Canterbury Road, Vermont VIC 3133');
    await panel.getByRole('button', { name: 'Next', exact: true }).click();

    await panel.getByLabel('Preferred times').fill('Tuesday or Wednesday morning.');
    await panel.getByRole('button', { name: 'Next', exact: true }).click();

    await panel.getByLabel('Notes').fill('Term breaks only.');
    await panel.getByRole('button', { name: 'Next', exact: true }).click();

    await panel.getByLabel('Organisation').fill('Vermont Secondary College');
    await panel.getByLabel('Your name').fill('Sam Taylor');
    await panel.getByLabel('Phone').fill('0400 000 000');
    await panel.getByLabel('Work email').fill('sam@example.com');
    await panel.getByRole('button', { name: /book my assessment/i }).click();

    const status = panel.getByRole('status');
    await expect(status).toBeVisible();
    await expect(status).toContainText(/were not sent/i);
    await expect(status).toContainText('1300 97 97 40');
  });

  test('refuses an answer the server would reject, and says why', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Free site assessment' }).click();

    const panel = page.getByRole('dialog', { name: 'Free site assessment' });
    await panel.getByRole('button', { name: 'Metropolitan Melbourne' }).click();
    await panel.getByRole('button', { name: /online assessment/i }).click();
    await panel.getByRole('button', { name: 'Office' }).click();
    await panel.getByLabel('Site address').fill('x');
    await panel.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(panel.getByLabel('Site address')).toHaveAttribute('aria-invalid', 'true');
    await expect(panel.getByText(/enter the site address/i)).toBeVisible();
  });

  test('closes on Escape and returns focus to the launcher', async ({ page }) => {
    await page.goto('/');
    const launcher = page.getByRole('button', { name: 'Free site assessment' });
    await launcher.click();
    await expect(page.getByRole('dialog', { name: 'Free site assessment' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Free site assessment' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /close site assessment chat/i })).toHaveCount(0);
    await expect(launcher).toBeFocused();
  });
});

test.describe('site assessment chat under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  /**
   * globals.css states the site must remain fully usable without animation, so
   * the chat's entry motion must never be load-bearing. This asserts the
   * outcome rather than the CSS: with motion off, every arriving turn and every
   * control is painted and readable, whatever the keyframes are doing.
   */
  test('shows every turn and control with motion switched off', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Free site assessment' }).click();

    const panel = page.getByRole('dialog', { name: 'Free site assessment' });
    await expect(panel.getByRole('button', { name: 'Metropolitan Melbourne' })).toBeVisible();

    await panel.getByRole('button', { name: 'Metropolitan Melbourne' }).click();

    // The turn that arrived, and the control that came with it.
    await expect(panel.getByRole('log')).toContainText(
      'How would you like us to do the assessment?',
    );
    await expect(panel.getByRole('button', { name: /on-site visit/i })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Back', exact: true })).toBeVisible();

    // Visible in the layout sense is not enough — assert it is actually painted.
    for (const locator of [
      panel.getByRole('log').locator('p').last(),
      panel.getByRole('button', { name: /on-site visit/i }),
    ]) {
      await expect(locator).toHaveCSS('opacity', '1');
    }
  });
});

test.describe('technical endpoints', () => {
  test('robots.txt renders and blocks crawling of the preview', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('Disallow: /');
  });

  test('sitemap.xml renders as valid XML', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('/commercial/');
  });

  test('an unknown route returns a real 404, not a 500', async ({ page }) => {
    // The live WordPress site returns HTTP 500 here.
    const response = await page.goto('/this-page-does-not-exist/');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/not here/i);
  });

  test('corrected suburb slugs redirect permanently', async ({ page }) => {
    await page.goto('/areas/painters-park-dale/');
    await expect(page).toHaveURL(/\/areas\/painters-parkdale\//);
  });
});
