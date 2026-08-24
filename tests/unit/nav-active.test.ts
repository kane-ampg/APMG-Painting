import { describe, expect, it } from 'vitest';
import { isCurrentPage, isSamePath, navActiveState } from '@/lib/nav/active';
import { mainNav } from '@/components/navigation/nav-data';

/** The Commercial item, which is the only one with a non-URL child hierarchy. */
const commercial = mainNav.find((item) => item.label === 'Commercial');
const residential = mainNav.find((item) => item.label === 'Residential');
const projects = mainNav.find((item) => item.label === 'Projects');

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
    expect(isCurrentPage('/residential-painting/', '/residential-painting/#interior')).toBe(false);
    expect(isCurrentPage('/residential-painting/', '/residential-painting/#exterior')).toBe(false);
    expect(isCurrentPage('/residential-painting/', '/residential-painting/')).toBe(true);
  });
});

describe('isSamePath', () => {
  it('spots the overview child that repeats its own section', () => {
    // Every dropdown opens with a link back to the page the trigger points at.
    // Both cannot announce themselves as the current page.
    for (const item of mainNav) {
      const overview = item.children?.filter((child) => isSamePath(child.href, item.href)) ?? [];
      expect(overview.length).toBeLessThanOrEqual(1);
    }
    expect(isSamePath('/commercial', '/commercial/')).toBe(true);
    expect(isSamePath('/commercial/', '/office-painters/')).toBe(false);
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
    expect(navActiveState('/commercial/', residential!)).toBe(false);
  });

  it('marks exactly one item as the current page for every top-level route', () => {
    for (const item of mainNav) {
      const marked = mainNav.filter((other) => navActiveState(item.href, other) === 'page');
      expect(marked.map((m) => m.label)).toEqual([item.label]);
    }
  });
});
