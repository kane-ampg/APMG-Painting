import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { QuoteChat } from '@/components/chat/quote-chat';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { JsonLd } from '@/components/seo/json-ld';
import { localBusinessSchema, organizationSchema } from '@/lib/schema';
import { isSandbox, site, siteUrl } from '@/lib/site';

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
    default: `${site.name} | Commercial & Residential Painters Melbourne`,
    template: `%s | ${site.name}`,
  },
  description:
    'APMG Painting is a Melbourne commercial and residential painting contractor, working across schools, healthcare, aged care, strata, retail and industrial sites.',
  // Sandbox-wide guard. Flipped only at production go-live.
  robots: isSandbox ? { index: false, follow: false } : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        <JsonLd data={organizationSchema()} />
        <JsonLd data={localBusinessSchema()} />

        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />

        {/*
          Outside <main> and last in the DOM: an assistive-technology user
          reaches the page's own content first, and the panel is additive — the
          full forms on /contact-us/ remain the primary, no-JavaScript route.
        */}
        <QuoteChat />

        <ScrollReveal />
      </body>
    </html>
  );
}
