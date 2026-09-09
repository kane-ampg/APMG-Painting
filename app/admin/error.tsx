'use client';

/**
 * Generic error boundary for the /admin segment. The allowlist check now
 * redirects rather than throws (see lib/auth/admin.ts — errors forwarded
 * from Server Components render as a generic message with no way to detect
 * the cause here), so this boundary only ever needs the one message.
 */
export default function AdminError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-2xl tracking-tight">Something went wrong</h1>
      <p className="text-ink-soft">Please try again in a moment.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mx-auto rounded bg-brand-600 px-4 py-2 font-medium text-white"
      >
        Try again
      </button>
    </main>
  );
}
