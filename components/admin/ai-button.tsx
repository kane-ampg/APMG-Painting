'use client';

// Stub. Task 10 wires this up to the Claude-backed AI helpers (alt text,
// summaries) and gives it a real UI. Kept as a no-op here so the entry form
// compiles and has a stable call site to swap in later.
export function AiButton(_props: {
  task: string;
  input: Record<string, string>;
  onResult: (r: Record<string, string>) => void;
}) {
  return null;
}
