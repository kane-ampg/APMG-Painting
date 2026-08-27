'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

/**
 * Defers the floating quote chat.
 *
 * QuoteChat was statically imported by the root layout, which put its entire
 * client module graph — the zod runtime, the chat flow and the chat FAQ
 * content — into the first-load JavaScript of every page on the site. The
 * full forms on /contact-us/ are the primary, no-JavaScript route (the layout
 * says so where it renders this), so the chat is exactly the "defer until
 * needed" case: it loads as its own chunk once the browser is idle, after
 * hydration and the LCP have had the bandwidth.
 */
const QuoteChat = dynamic(() => import('./quote-chat').then((mod) => mod.QuoteChat), {
  ssr: false,
});

export function QuoteChatLazy() {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setLoad(true), { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    // Safari has no requestIdleCallback; a short timeout lands after
    // hydration without meaningfully delaying the widget.
    const id = window.setTimeout(() => setLoad(true), 2000);
    return () => window.clearTimeout(id);
  }, []);

  return load ? <QuoteChat /> : null;
}
