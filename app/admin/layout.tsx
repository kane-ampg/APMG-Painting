import type { Metadata } from 'next';
import Link from 'next/link';
import { signOut } from '@/app/actions/auth';

export const metadata: Metadata = {
  title: 'APMG editor',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

/**
 * The admin shell. Auth is enforced per page via requireAdmin() rather than
 * here, because the login page shares this layout.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
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
    </div>
  );
}
