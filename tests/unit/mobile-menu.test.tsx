import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileMenu } from '@/components/navigation/mobile-menu';
import { SiteSettingsProvider } from '@/components/providers/site-settings';
import { defaultSiteSettings } from '@/lib/site';

/**
 * The drawer's section accordion.
 *
 * The sub-links animate open and closed, which means they stay in the DOM
 * while collapsed. Anything in the DOM is reachable by Tab and by a screen
 * reader unless it is made inert — so the behaviour that matters is not the
 * motion but that a collapsed section is genuinely out of the way.
 */

const { pathname } = vi.hoisted(() => ({ pathname: { current: '/projects/' } }));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.current,
}));

beforeEach(() => {
  // A page under no section, so the drawer opens with everything collapsed.
  pathname.current = '/projects/';
});

async function openDrawer() {
  const user = userEvent.setup();
  render(
    <SiteSettingsProvider value={defaultSiteSettings}>
      <MobileMenu />
    </SiteSettingsProvider>,
  );
  await user.click(screen.getByRole('button', { name: /^menu$/i }));
  return user;
}

describe('the section accordion', () => {
  it('keeps a collapsed section out of the tab order and the accessibility tree', async () => {
    await openDrawer();

    const link = screen.getByRole('link', { name: 'Office painting', hidden: true });
    expect(link.closest('[inert]')).not.toBeNull();
    expect(screen.getByRole('button', { name: /expand commercial links/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('lets the links through once the section is expanded', async () => {
    const user = await openDrawer();

    await user.click(screen.getByRole('button', { name: /expand commercial links/i }));

    const link = screen.getByRole('link', { name: 'Office painting' });
    expect(link.closest('[inert]')).toBeNull();
    expect(screen.getByRole('button', { name: /collapse commercial links/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('makes the links inert again on collapse', async () => {
    const user = await openDrawer();

    await user.click(screen.getByRole('button', { name: /expand commercial links/i }));
    await user.click(screen.getByRole('button', { name: /collapse commercial links/i }));

    const link = screen.getByRole('link', { name: 'Office painting', hidden: true });
    expect(link.closest('[inert]')).not.toBeNull();
  });

  it('opens with the current page’s section already expanded', async () => {
    pathname.current = '/office-painters/';
    await openDrawer();

    const link = screen.getByRole('link', { name: 'Office painting' });
    expect(link.closest('[inert]')).toBeNull();
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('does not wrap the focus trap onto a collapsed link', async () => {
    const user = await openDrawer();

    // Shift+Tab from the first control wraps to the last focusable thing in the
    // drawer. With Commercial collapsed, that must be the phone link at the
    // bottom — never one of the hidden sector links.
    screen.getByRole('button', { name: /^close$/i }).focus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');

    expect(document.activeElement?.closest('[inert]')).toBeNull();
    expect(document.activeElement).toHaveAttribute('href', 'tel:1300979740');
  });
});
