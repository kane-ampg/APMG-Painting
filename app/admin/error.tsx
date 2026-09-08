'use client';

/**
 * Error boundary for the /admin segment. `requireAdmin()` throws
 * `AdminForbiddenError` for a signed-in user who is not on the allowlist —
 * that is the one case worth a tailored message. Everything else gets a
 * generic apology plus a retry.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isForbidden = error.message.includes('allowlist');

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-2xl tracking-tight">
        {isForbidden ? 'Not an APMG editor' : 'Something went wrong'}
      </h1>
      <p className="text-ink-soft">
        {isForbidden
          ? 'This account is not an APMG editor. Ask Kane to add you.'
          : 'Please try again in a moment.'}
      </p>
      {!isForbidden && (
        <button
          type="button"
          onClick={() => reset()}
          className="mx-auto rounded bg-brand-600 px-4 py-2 font-medium text-white"
        >
          Try again
        </button>
      )}
    </main>
  );
}
