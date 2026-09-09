'use client';

import { useActionState } from 'react';
import { sendMagicLink, type AuthState } from '@/app/actions/auth';

/** The magic-link request form. Client-only because it needs form state. */
export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(sendMagicLink, {
    status: 'idle',
  });

  return (
    <>
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
    </>
  );
}
