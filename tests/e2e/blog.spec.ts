import { expect, test } from '@playwright/test';

test('blog index renders and is linked from the nav', async ({ page, isMobile }) => {
  await page.goto('/');
  // Below the lg breakpoint the desktop bar is hidden and the link lives in
  // the drawer, which only exists in the DOM once opened — same pattern as
  // the other nav tests in tests/e2e/wayfinding.spec.ts.
  if (isMobile) {
    await page.getByRole('button', { name: /menu/i }).click();
    await page
      .getByRole('dialog', { name: 'Site menu' })
      .getByRole('link', { name: 'Blog' })
      .click();
  } else {
    await page.getByRole('link', { name: 'Blog' }).first().click();
  }
  await expect(page).toHaveURL(/\/blog\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Notes from the job');
});

test('sitemap lists the blog index', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  expect(xml).toContain('/blog/');
});
