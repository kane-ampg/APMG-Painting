/**
 * "Where am I?" for the navigation.
 *
 * Two states, not one. A link can be the page you are looking at, or it can be
 * the section that page lives in — `/schools-painting/` is not a URL descendant
 * of `/commercial/`, but Commercial is still where it sits in the menu, and a
 * visitor who opened the Commercial dropdown to get there expects to see that.
 *
 * Kept as pure functions rather than a hook so it can be unit tested against a
 * pathname without rendering a router.
 */

export type NavActiveState = 'page' | 'section' | false;

/** A nav entry, narrowed to only what deciding "current" needs. */
export type NavTarget = {
  href: string;
  children?: readonly { href: string }[];
};

/**
 * Trailing slashes are configured on (`trailingSlash: true`), but nav data is
 * hand-written and `usePathname()` reports what is in the address bar, so
 * neither side can be trusted to agree on the final `/`. Compare without it.
 */
function normalise(path: string): string {
  const withoutQuery = path.split('?')[0] ?? '';
  const withoutHash = withoutQuery.split('#')[0] ?? '';
  if (withoutHash === '' || withoutHash === '/') return '/';
  return withoutHash.endsWith('/') ? withoutHash.slice(0, -1) : withoutHash;
}

/**
 * Do two nav hrefs point at the same page?
 *
 * Every dropdown repeats its own section as an "Overview" child, so the
 * trigger and the first item under it are one destination. Only one of them may
 * announce itself as the current page.
 */
export function isSamePath(a: string, b: string): boolean {
  return normalise(a) === normalise(b);
}

/** An in-page anchor such as `/residential-painting/#interior`. */
function isAnchorLink(href: string): boolean {
  return href.includes('#');
}

/**
 * Is `href` the page currently being viewed?
 *
 * Anchor links are never "the current page". `#interior` and `#exterior` both
 * live on `/residential-painting/`, so marking them current would put three
 * `aria-current="page"` links in one menu and tell a screen-reader user that
 * they are in three places at once. Which anchor is on screen is a scroll
 * position, not a route, and the navigation has no business guessing it.
 */
export function isCurrentPage(pathname: string, href: string): boolean {
  if (isAnchorLink(href)) return false;
  return normalise(pathname) === normalise(href);
}

/**
 * The active state of a nav item, given the current pathname.
 *
 *  - `'page'`    — this exact page. Gets `aria-current="page"`.
 *  - `'section'` — an ancestor of this page, either by URL (`/projects/` while
 *                  on `/projects/glen-waverley/`) or by menu structure (any of
 *                  its children is the current page). Styled, but not given
 *                  `aria-current` — only one thing can be *the* current page.
 *  - `false`     — elsewhere.
 */
export function navActiveState(pathname: string, item: NavTarget): NavActiveState {
  if (isCurrentPage(pathname, item.href)) return 'page';

  const here = normalise(pathname);
  const target = normalise(item.href);

  // URL descendant: /projects/ is the section for /projects/some-job/.
  if (target !== '/' && here.startsWith(`${target}/`)) return 'section';

  // Menu descendant: Commercial is the section for /schools-painting/.
  if (item.children?.some((child) => isCurrentPage(pathname, child.href))) {
    return 'section';
  }

  return false;
}
