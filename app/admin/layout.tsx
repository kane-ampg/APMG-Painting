import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import Link from 'next/link';
import '../globals.css';
import { signOut } from '@/app/actions/auth';
import { siteUrl } from '@/lib/site';

/**
 * A second root layout, not a nested one.
 *
 * Every public route lives under `app/(site)/` with its own root layout; the
 * admin has this one. Route groups are invisible in the URL, so nothing
 * moves — but the editor no longer renders inside the public shell, which
 * was putting the site header, footer, chat panel and LocalBusiness JSON-LD
 * around the login form and running `getServices()` on every admin request.
 */

// The same two faces the public layout uses, so the editor looks like the
// site it edits. Self-hosted and subset by next/font at build time.
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
  // A second root layout needs its own base: `app/opengraph-image.tsx` sits
  // above both, and without this Next resolves it against localhost and
  // warns on every admin route.
  metadataBase: new URL(siteUrl),
  title: 'APMG editor',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

// Admin pages read the session on every request and must never be prerendered.
export const dynamic = 'force-dynamic';

/**
 * The admin shell. Auth is enforced per page via requireAdmin() rather than
 * here, because the login page shares this layout.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink">
        <header className="flex items-center justify-between border-b border-paper-edge px-6 py-3 text-sm">
          <nav className="flex gap-4">
            <Link href="/admin/">Dashboard</Link>
            <Link href="/admin/projects/">Projects</Link>
            <Link href="/admin/services/">Services</Link>
            <Link href="/admin/posts/">Blog</Link>
            <Link href="/admin/media/">Media</Link>
          </nav>
          <form action={signOut}>
            <button type="submit" className="underline">
              Sign out
            </button>
          </form>
        </header>
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </body>
    </html>
  );
}
