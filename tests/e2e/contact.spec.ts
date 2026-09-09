import { expect, test } from '@playwright/test';

/** The header's link carries a visually-hidden "Call " for screen readers. */
const digits = (text: string | null) => (text ?? '').replace(/\D/g, '');

/**
 * One phone number, everywhere.
 *
 * The number is a CMS setting now, threaded to the header through
 * `SiteSettingsProvider` and to the page through `getSiteSettings()`. Two
 * paths to one fact is exactly the shape that drifts, so every tap-to-call
 * link on /contact-us/ is checked against the header's.
 */
test('contact page shows one phone number, and it matches the header', async ({ page }) => {
  await page.goto('/contact-us/');

  const headerPhone = digits(await page.locator('header a[href^="tel:"]').first().textContent());
  expect(headerPhone).not.toBe('');

  const links = page.locator('main a[href^="tel:"]');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    expect(digits(await links.nth(i).textContent())).toBe(headerPhone);
  }
});

test('tel link digits match the displayed number', async ({ page }) => {
  await page.goto('/contact-us/');
  const link = page.locator('main a[href^="tel:"]').first();
  const href = await link.getAttribute('href');
  expect(href).toBe(`tel:${digits(await link.textContent())}`);
});
