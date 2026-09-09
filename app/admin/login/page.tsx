import { LoginForm } from './login-form';

/**
 * Notice shown above the form, keyed off the `error` search param the proxy
 * and the auth callback route redirect back with. A server component reads
 * it directly from `searchParams` rather than the client reading it via
 * `useSearchParams`, so the page needs no Suspense boundary.
 */
function noticeFor(error: string | string[] | undefined): string | null {
  const value = Array.isArray(error) ? error[0] : error;
  if (value === 'forbidden') return 'This account is not an APMG editor. Ask Kane to add you.';
  if (value === 'link')
    return 'That sign-in link has expired or was already used. Request a new one.';
  return null;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  const notice = noticeFor(error);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="font-display text-2xl tracking-tight">APMG Painting — editor sign in</h1>
      {notice && (
        <p role="status" className="text-red-700">
          {notice}
        </p>
      )}
      <LoginForm />
    </main>
  );
}
