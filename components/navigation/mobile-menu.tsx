'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { mainNav } from './nav-data';
import { site } from '@/lib/site';

/**
 * Mobile navigation drawer.
 *
 * The only client component in the header. Everything else in the layout is a
 * Server Component.
 *
 * Accessibility: the trigger is a real button with aria-expanded/aria-controls,
 * Escape closes, focus is trapped only while open, and focus returns to the
 * trigger on close. Sub-menus are disclosure buttons, not hover targets.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* A modal drawer is a dialog: it traps focus, closes on Escape, and
          makes the rest of the page inert to interaction while open. */}
      <div
        id={panelId}
        ref={panelRef}
        hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-white p-6 shadow-xl lg:hidden"
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
            {mainNav.map((item) => (
              <li key={item.href}>
                {item.children ? (
                  <>
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex-1 rounded-md px-3 py-3 text-base font-semibold text-ink hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                      >
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        aria-expanded={expanded === item.label}
                        aria-label={`${expanded === item.label ? 'Collapse' : 'Expand'} ${item.label} links`}
                        onClick={() =>
                          setExpanded((current) => (current === item.label ? null : item.label))
                        }
                        className="rounded-md px-3 py-3 text-ink-muted hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                      >
                        <span aria-hidden="true">{expanded === item.label ? '−' : '+'}</span>
                      </button>
                    </div>
                    {expanded === item.label && (
                      <ul className="mb-2 ml-3 flex flex-col gap-0.5 border-l border-paper-edge pl-3">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={() => setOpen(false)}
                              className="block rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3 text-base font-semibold text-ink hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6 flex flex-col gap-3 border-t border-paper-edge pt-6">
          <Link
            href="/contact-us/#commercial"
            onClick={() => setOpen(false)}
            className="rounded-md bg-brand-700 px-5 py-3 text-center text-sm font-semibold text-white"
          >
            Request a site assessment
          </Link>
          <Link
            href="/contact-us/#residential"
            onClick={() => setOpen(false)}
            className="rounded-md border border-paper-edge px-5 py-3 text-center text-sm font-semibold text-ink"
          >
            Request a free quote
          </Link>
          <a
            href={site.phone.href}
            className="py-2 text-center text-sm font-semibold text-brand-700"
          >
            {site.phone.display}
          </a>
        </div>
      </div>
    </>
  );
}
