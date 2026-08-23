import { expect, test } from '@playwright/test';

/**
 * The critical end-to-end flows named in the brief.
 */

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

  test('reaches the commercial page and it targets the commercial query', async ({ page }) => {
    await page.goto('/commercial/');
    await expect(page).toHaveTitle(/Commercial Painters Melbourne/i);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      /Commercial painters in Melbourne/i,
    );
  });

  test('reaches the residential page', async ({ page }) => {
    await page.goto('/residential-painting/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/House painters/i);
  });

  test('the homepage no longer competes for the commercial query', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).not.toMatch(/^Commercial Painters Melbourne/i);
    expect(title).toMatch(/APMG Painting/);
  });

  test('every page has exactly one h1', async ({ page }) => {
    for (const path of ['/', '/commercial/', '/residential-painting/', '/projects/', '/about-us/']) {
      await page.goto(path);
      await expect(page.locator('h1'), `h1 count on ${path}`).toHaveCount(1);
    }
  });
});

test.describe('projects', () => {
  test('opens a case study with its documented detail', async ({ page }) => {
    await page.goto('/projects/');
    await page.getByRole('link', { name: /Emmaus College/i }).first().click();

    await expect(page).toHaveURL(/\/projects\/emmaus-college-school-repaint-vermont\//);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Emmaus College');
    await expect(page.getByRole('heading', { name: 'Access and safety' })).toBeVisible();
    await expect(page.getByText(/Boom lift \(EWP\)/i)).toBeVisible();
  });
});

test.describe('commercial enquiry', () => {
  test('rejects invalid data with accessible field errors', async ({ page }) => {
    await page.goto('/contact-us/#commercial');

    const form = page.locator('form').filter({ has: page.getByLabel('Organisation') });
    await form.getByLabel('Your name').fill('A');
    await form.getByLabel('Email').fill('not-an-email');
    await form.getByRole('button', { name: /send enquiry/i }).click();

    const email = form.getByLabel('Email');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(form.getByText(/valid email address/i)).toBeVisible();
  });

  test('accepts valid data and states plainly that nothing was delivered', async ({ page }) => {
    await page.goto('/contact-us/#commercial');

    const form = page.locator('form').filter({ has: page.getByLabel('Organisation') });
    await form.getByLabel('Your name').fill('Alex Chen');
    await form.getByLabel('Organisation').fill('Vermont Secondary College');
    await form.getByLabel('Phone').fill('03 9000 0000');
    await form.getByLabel('Email').fill('facilities@example.edu.au');
    await form.getByLabel('Property or sector type').selectOption('education-and-childcare');
    await form.getByLabel('Project location').fill('Vermont');
    await form.getByLabel('Scope summary').fill('Internal common areas and two elevations.');
    await form.getByLabel('Desired timeframe').selectOption('planning');

    // The server enforces a minimum completion time to catch bots.
    await page.waitForTimeout(3500);
    await form.getByRole('button', { name: /send enquiry/i }).click();

    const status = form.getByRole('status');
    await expect(status).toBeVisible();
    // No transport is configured, so the UI must not imply delivery.
    await expect(status).toContainText(/were not sent/i);
    await expect(status).toContainText('1300 97 97 40');
  });
});

test.describe('residential enquiry', () => {
  test('accepts valid data', async ({ page }) => {
    await page.goto('/contact-us/#residential');

    const form = page.locator('form').filter({ has: page.getByLabel('Suburb') });
    await form.getByLabel('Your name').fill('Jo Smith');
    await form.getByLabel('Phone').fill('0400 000 000');
    await form.getByLabel('Email').fill('jo@example.com');
    await form.getByLabel('Suburb').fill('Camberwell');
    await form.getByLabel('Property type').selectOption('house');
    await form.getByLabel('What needs painting?').selectOption('both');
    await form.getByLabel('Approximate timeframe').selectOption('1-3-months');
    await form.getByLabel('Tell us about the job').fill('Weatherboard exterior, peeling on the north face.');

    await page.waitForTimeout(3500);
    await form.getByRole('button', { name: /request a free quote/i }).click();

    await expect(form.getByRole('status')).toBeVisible();
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
