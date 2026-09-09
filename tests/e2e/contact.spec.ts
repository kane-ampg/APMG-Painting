import { expect, test } from '@playwright/test';

/** The header's link carries a visually-hidden "Call " for screen readers. */
const digits = (text: string | null) => (text ?? '').replace(/\D/g, '');

test('contact page shows one phone number, and it matches the header', async ({ page }) => {
  await page.goto('/contact-us/');
  const headerPhone = await page.locator('header a[href^="tel:"]').first().textContent();
  const contactPhone = await page
    .getByRole('definition')
    .locator('a[href^="tel:"]')
    .first()
    .textContent();
  expect(digits(contactPhone)).toBe(digits(headerPhone));
});

test('tel link digits match the displayed number', async ({ page }) => {
  await page.goto('/contact-us/');
  const link = page.getByRole('definition').locator('a[href^="tel:"]').first();
  const href = await link.getAttribute('href');
  const text = digits(await link.textContent());
  expect(href).toBe(`tel:${text}`);
});
