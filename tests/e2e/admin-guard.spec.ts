import { expect, test } from '@playwright/test';

// No Supabase project exists yet, so `NEXT_PUBLIC_SUPABASE_URL` is unset in
// this environment. proxy.ts redirects `/admin` to `/` (not to the login
// page) when Supabase env is absent, so these assertions cannot pass here.
// Populate `.env.local` with real Supabase credentials to run this spec.
test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, 'needs Supabase env');

test('anonymous /admin redirects to login', async ({ page }) => {
  await page.goto('/admin/');
  await expect(page).toHaveURL(/\/admin\/login\/?$/);
  await expect(page.getByRole('heading', { name: /editor sign in/i })).toBeVisible();
});

test('admin pages are noindex', async ({ page }) => {
  await page.goto('/admin/login/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
