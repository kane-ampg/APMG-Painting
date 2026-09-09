'use client';

import { useState, useTransition } from 'react';
import { aiDescribeImage, aiPostSummary } from '@/app/actions/ai';

type Props =
  | {
      task: 'post-summary';
      input: { title: string; body: string };
      onResult: (r: Record<string, string>) => void;
    }
  | {
      task: 'describe-image';
      input: { imageUrl: string };
      onResult: (r: Record<string, string>) => void;
    };

/**
 * One button, one field group. Fills the form; never saves. The editor
 * reads what came back and decides.
 */
export function AiButton(props: Props) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = () =>
    start(async () => {
      setMessage(null);
      const result =
        props.task === 'post-summary'
          ? await aiPostSummary(props.input)
          : await aiDescribeImage(props.input.imageUrl);
      if (result.ok) {
        props.onResult(result.data as Record<string, string>);
        setMessage('Drafted. Check it before saving.');
      } else {
        setMessage(result.message);
      }
    });

  return (
    <span className="flex items-center gap-2 text-xs">
      <button type="button" onClick={run} disabled={pending} className="rounded border px-2 py-1">
        {pending
          ? 'Thinking…'
          : props.task === 'post-summary'
            ? 'Draft summary with AI'
            : 'Describe with AI'}
      </button>
      {message && <span className="text-ink-soft">{message}</span>}
    </span>
  );
}
