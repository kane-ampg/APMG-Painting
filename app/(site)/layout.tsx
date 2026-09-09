import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import '../globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { QuoteChatLazy } from '@/components/chat/quote-chat-lazy';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { SiteSettingsProvider } from '@/components/providers/site-settings';
import { JsonLd } from '@/components/seo/json-ld';
import { localBusinessSchema } from '@/lib/schema';
import { getServices, getSiteSettings } from '@/lib/content/source';
import { noindexAll, site, siteUrl } from '@/lib/site';

/**
 * Fonts are self-hosted and subset by next/font at build time — no runtime
 * request to a font CDN, and no layout shift from a late swap.
 */
const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  weight: ['600', '700'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} | Commercial Painters Melbourne`,
    template: `%s | ${site.name}`,
  },
  description:
    'APMG Painting is a Melbourne commercial painting contractor, working across schools, healthcare, aged care, strata, retail and industrial sites.',
  // Layer 1 of the editor deployment's lockdown — see `noindexAll`.
  robots: noindexAll ? { index: false, follow: false } : undefined,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [services, settings] = await Promise.all([getServices(), getSiteSettings()]);

  return (
    <html lang="en-AU" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        {/* One entity node, not an Organization + LocalBusiness pair —
            lib/schema/index.ts explains the merge. */}
        <JsonLd data={localBusinessSchema(services, settings)} />

        {/* Wraps everything, because the header, the mobile menu, the chat and
            the enquiry forms are all client components that state the phone
            number and must all state the same one. */}
        <SiteSettingsProvider value={settings}>
          <Header settings={settings} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer settings={settings} />

          {/*
            Outside <main> and last in the DOM: an assistive-technology user
            reaches the page's own content first, and the panel is additive — the
            full forms on /contact-us/ remain the primary, no-JavaScript route.
          */}
          <QuoteChatLazy />
        </SiteSettingsProvider>

        <ScrollReveal />
      </body>
    </html>
  );
}
