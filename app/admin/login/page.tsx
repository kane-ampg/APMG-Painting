'use client';

import { useActionState } from 'react';
import { sendMagicLink, type AuthState } from '@/app/actions/auth';

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(sendMagicLink, {
    status: 'idle',
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="font-display text-2xl tracking-tight">APMG Painting — editor sign in</h1>
      <form action={action} className="flex flex-col gap-3">
        <label className="text-sm font-medium" htmlFor="email">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border border-paper-edge px-3 py-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-brand-600 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Sending…' : 'Email me a sign-in link'}
        </button>
      </form>
      {state.message && (
        <p role="status" className={state.status === 'error' ? 'text-red-700' : 'text-ink-soft'}>
          {state.message}
        </p>
      )}
    </main>
  );
}
