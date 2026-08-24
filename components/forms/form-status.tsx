'use client';

import { useEffect, useRef } from 'react';
import { site } from '@/lib/site';

/**
 * The result of an enquiry submission.
 *
 * Shared by the contact-page forms and the floating quote chat. Both routes end
 * at the same Server Action, so both must report the outcome in the same words
 * — in particular the sandbox case, where the payload validated but no
 * transport is configured and therefore nobody received it. `status: 'success'`
 * with `delivered: false` says so plainly rather than implying a reply is
 * coming. Two copies of that message would eventually become two different
 * promises.
 */
export function FormStatus({
  status,
  message,
  delivered,
}: {
  status: 'idle' | 'success' | 'error';
  message?: string;
  delivered?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== 'idle') ref.current?.focus();
  }, [status]);

  if (status === 'idle') return null;

  const isSuccess = status === 'success';

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      className={
        isSuccess
          ? 'rounded-md border border-emerald-600 bg-emerald-50 p-4 text-sm text-emerald-900'
          : 'rounded-md border border-red-700 bg-red-50 p-4 text-sm text-red-900'
      }
    >
      {isSuccess && !delivered ? (
        <>
          <p className="font-semibold">Your details passed validation — but were not sent.</p>
          <p className="mt-1">
            This is a preview build with no mail delivery configured, so nobody has received this.
            Please call {site.phone.display} to reach the team.
          </p>
        </>
      ) : (
        <p>{message}</p>
      )}
    </div>
  );
}
