import { describe, expect, it } from 'vitest';
import { isCurrentPage, isSamePath, navActiveState } from '@/lib/nav/active';
import { mainNav } from '@/components/navigation/nav-data';

/** The Commercial item, which is the only one with a non-URL child hierarchy. */
const commercial = mainNav.find((item) => item.label === 'Commercial');
const projects = mainNav.find((item) => item.label === 'Projects');
const about = mainNav.find((item) => item.label === 'About');

describe('isCurrentPage', () => {
  it('matches regardless of trailing slash on either side', () => {
    expect(isCurrentPage('/commercial/', '/commercial/')).toBe(true);
    expect(isCurrentPage('/commercial', '/commercial/')).toBe(true);
    expect(isCurrentPage('/commercial/', '/commercial')).toBe(true);
  });

  it('matches the home page', () => {
    expect(isCurrentPage('/', '/')).toBe(true);
    expect(isCurrentPage('/', '/commercial/')).toBe(false);
  });

  it('does not treat a prefix as a match', () => {
    expect(isCurrentPage('/commercial-kitchens/', '/commercial/')).toBe(false);
  });

  it('never marks an in-page anchor as the current page', () => {
    // Three links would otherwise claim to be the current page at once.
    expect(isCurrentPage('/commercial/', '/commercial/#preparation')).toBe(false);
    expect(isCurrentPage('/commercial/', '/commercial/#access')).toBe(false);
    expect(isCurrentPage('/commercial/', '/commercial/')).toBe(true);
  });
});

describe('isSamePath', () => {
  it('ignores trailing slashes and in-page anchors', () => {
    expect(isSamePath('/commercial', '/commercial/')).toBe(true);
    expect(isSamePath('/commercial/#preparation', '/commercial/')).toBe(true);
    expect(isSamePath('/commercial/', '/office-painters/')).toBe(false);
  });
});

/**
 * The rule the two menus implement: a child link announces itself only if it is
 * the current page *and* is not simply repeating the section trigger above it.
 * Every dropdown opens with an "Overview" link back to its own section, so
 * without the second half both would claim to be the current page.
 */
function announcedCount(pathname: string): number {
  let count = 0;
  for (const item of mainNav) {
    if (navActiveState(pathname, item) === 'page') count += 1;
    for (const child of item.children ?? []) {
      if (isCurrentPage(pathname, child.href) && !isSamePath(child.href, item.href)) count += 1;
    }
  }
  return count;
}

describe('aria-current across the whole menu', () => {
  it('announces exactly one current page, dropdowns included', () => {
    const everyDestination = mainNav.flatMap((item) => [
      item.href,
      ...(item.children ?? []).map((child) => child.href),
    ]);

    for (const href of everyDestination) {
      // Anchors are not destinations of their own; they land on their section.
      expect(announcedCount(href), `on ${href}`).toBe(1);
    }
  });
});

describe('navActiveState', () => {
  it('marks the exact page', () => {
    expect(navActiveState('/commercial/', commercial!)).toBe('page');
    expect(navActiveState('/projects/', projects!)).toBe('page');
  });

  it('marks a URL descendant as the section', () => {
    expect(navActiveState('/projects/some-job/', projects!)).toBe('section');
  });

  it('marks the parent of a sector page that is not a URL descendant', () => {
    // /office-painters/ sits under Commercial in the menu but not in the URL.
    expect(navActiveState('/office-painters/', commercial!)).toBe('section');
  });

  it('leaves unrelated items inactive', () => {
    expect(navActiveState('/about-us/', commercial!)).toBe(false);
    expect(navActiveState('/commercial/', about!)).toBe(false);
  });

  it('marks exactly one item as the current page for every top-level route', () => {
    for (const item of mainNav) {
      const marked = mainNav.filter((other) => navActiveState(item.href, other) === 'page');
      expect(marked.map((m) => m.label)).toEqual([item.label]);
    }
  });
});
