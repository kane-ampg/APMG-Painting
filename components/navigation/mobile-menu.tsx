'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { mainNav } from './nav-data';
import { isCurrentPage, isSamePath, navActiveState } from '@/lib/nav/active';
import { cn } from '@/lib/utils';
import { site } from '@/lib/site';

/** The menu section the given page sits under, if it is not a top-level item. */
function activeSection(pathname: string): string | null {
  return mainNav.find((item) => navActiveState(pathname, item) === 'section')?.label ?? null;
}

/**
 * Mobile navigation drawer.
 *
 * The only client component in the header. Everything else in the layout is a
 * Server Component.
 *
 * **The drawer is rendered into <body> through a portal, and it has to be.**
 * The header carries `backdrop-blur`, and a `backdrop-filter` makes an element
 * a containing block for its `position: fixed` descendants. Rendered in place,
 * `inset-y-0` therefore resolved against the *header* rather than the
 * viewport, and the drawer collapsed to the height of the header — a 64px
 * strip showing "Menu" and "Close" with every link scrolled out of sight
 * inside it. The panel was in the DOM and had a bounding box the whole time,
 * which is why it took a measured height to catch rather than a query for the
 * links. Moving the panel out of that ancestor is the fix; do not render it
 * back inside the header.
 *
 * Accessibility: the trigger is a real button with aria-expanded/aria-controls,
 * Escape closes, focus is trapped only while open, and focus returns to the
 * trigger on close. Sub-menus are disclosure buttons, not hover targets. The
 * current page carries `aria-current="page"`, and is marked visually by both a
 * colour change and a rule down its left edge so the cue survives for anyone
 * who cannot separate the two colours (WCAG 1.4.1).
 */
export function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(() => activeSection(pathname));
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus into the dialog on open. Without this the next Tab continues
  // from the trigger into the page behind the drawer, which the trap then
  // fights, and a screen-reader user is never told the dialog opened.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  // Escape to close, and trap Tab within the panel while open.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Prevent the page behind the drawer from scrolling.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /*
   * Open the drawer already showing where you are.
   *
   * The section holding the current page is expanded, so someone on
   * /schools-painting/ opens the menu and finds Commercial already unfolded
   * with Schools marked — rather than a flat list of six labels, none of which
   * is the page they are on. Re-run per route so it follows the visitor, and
   * close the drawer on the way: a navigation the drawer did not initiate (the
   * back button, a link in the page behind it) would otherwise leave it hanging
   * over the new page.
   *
   * Adjusted during render, not in an effect: the drawer must never be painted
   * open over the page it just took you to, and an effect runs too late for
   * that.
   */
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOpen(false);
    setExpanded(activeSection(pathname));
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-2 rounded-md border border-paper-edge px-3 py-2 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 lg:hidden"
      >
        <span aria-hidden="true" className="flex h-4 w-5 flex-col justify-between">
          <span className="block h-0.5 w-full bg-ink" />
          <span className="block h-0.5 w-full bg-ink" />
          <span className="block h-0.5 w-full bg-ink" />
        </span>
        Menu
      </button>

      {/*
        No `mounted` flag needed: the portal exists only while `open`, and
        `open` starts false and can only be set by a click. The server render
        and the first client render therefore both produce nothing here, so
        there is no hydration mismatch to guard against.
      */}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-50 animate-scrim-in bg-ink/50 lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            {/* A modal drawer is a dialog: it traps focus, closes on Escape, and
                makes the rest of the page inert to interaction while open. */}
            <div
              id={panelId}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              tabIndex={-1}
              /*
               * `w-[min(20rem,86vw)]`, not `w-full max-w-sm`. On a 390px phone
               * the old pair resolved to 384px — the whole screen — so the
               * drawer read as a page swap rather than as a panel over the
               * page. Leaving a strip of the scrim showing is what makes it
               * legible as a sidebar, and gives a thumb somewhere to tap to
               * dismiss it.
               */
              className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,86vw)] animate-drawer-in flex-col overflow-y-auto border-l border-paper-edge bg-white p-6 shadow-2xl lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-display text-lg font-semibold">Menu</span>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className="rounded-md border border-paper-edge px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  Close
                </button>
              </div>

              <nav aria-label="Main">
                <ul className="flex flex-col gap-1">
                  {mainNav.map((item) => {
                    const active = navActiveState(pathname, item);
                    /*
                     * Three states, each separated from the next by something
                     * other than colour: the page you are on is filled and
                     * ruled, its section is ruled only, everything else is
                     * neither (WCAG 1.4.1).
                     *
                     * The transparent rule is on every item, not just the
                     * active ones. Without it the label of whichever item is
                     * current sits 2px right of all the others, and the whole
                     * list shifts as you move through the site.
                     */
                    const top = cn(
                      'rounded-md border-l-2 border-transparent px-3 py-3 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                      active === 'page' && 'border-brand-600 bg-brand-50 text-brand-700',
                      active === 'section' &&
                        'border-brand-400 text-brand-700 hover:bg-paper-sunken',
                      !active && 'text-ink hover:bg-paper-sunken',
                    );
                    const isExpanded = expanded === item.label;

                    return (
                      <li key={item.href}>
                        {item.children ? (
                          <>
                            <div className="flex items-center">
                              <Link
                                href={item.href}
                                onClick={() => setOpen(false)}
                                aria-current={active === 'page' ? 'page' : undefined}
                                className={cn(top, 'flex-1')}
                              >
                                {item.label}
                              </Link>
                              <button
                                type="button"
                                aria-expanded={isExpanded}
                                aria-label={
                                  (isExpanded ? 'Collapse ' : 'Expand ') + item.label + ' links'
                                }
                                onClick={() =>
                                  setExpanded((current) =>
                                    current === item.label ? null : item.label,
                                  )
                                }
                                className="rounded-md px-3 py-3 text-ink-muted hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                              >
                                <span aria-hidden="true">{isExpanded ? '−' : '+'}</span>
                              </button>
                            </div>
                            {isExpanded && (
                              <ul className="mb-2 ml-3 flex flex-col gap-0.5 border-l border-paper-edge pl-3">
                                {item.children.map((child) => {
                                  const isCurrent = isCurrentPage(pathname, child.href);
                                  // The "Overview" child repeats its own section's
                                  // link, which is already marked above it. Styled,
                                  // but not announced as the current page twice.
                                  const announce = isCurrent && !isSamePath(child.href, item.href);
                                  return (
                                    <li key={child.href}>
                                      <Link
                                        href={child.href}
                                        onClick={() => setOpen(false)}
                                        aria-current={announce ? 'page' : undefined}
                                        className={cn(
                                          'block rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                                          isCurrent
                                            ? 'bg-brand-50 font-semibold text-brand-700'
                                            : 'text-ink-soft hover:bg-paper-sunken',
                                        )}
                                      >
                                        {child.label}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            aria-current={active === 'page' ? 'page' : undefined}
                            className={cn(top, 'block')}
                          >
                            {item.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="mt-auto flex flex-col gap-3 border-t border-paper-edge pt-6">
                <Link
                  href="/contact-us/#commercial"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-brand-700 px-5 py-3 text-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Request a site assessment
                </Link>
                <Link
                  href="/contact-us/#residential"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-paper-edge px-5 py-3 text-center text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  Request a free quote
                </Link>
                <a
                  href={site.phone.href}
                  className="rounded py-2 text-center text-sm font-semibold text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  {site.phone.display}
                </a>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
