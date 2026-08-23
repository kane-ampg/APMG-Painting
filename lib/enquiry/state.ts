/**
 * Enquiry form state.
 *
 * Lives outside the Server Action module on purpose: a `'use server'` file may
 * only export async functions, so exporting the type and the initial-state
 * object from there fails at runtime (and not at build time, which is how it
 * slipped through the first time).
 */
export type EnquiryState = {
  status: 'idle' | 'success' | 'error';
  /** Field-level errors, keyed by field name. */
  errors?: Record<string, string[]>;
  /** One message for the user. Never leaks internals. */
  message?: string;
  /**
   * Whether the enquiry was actually delivered. False alongside status
   * 'success' means it validated but no transport is configured — the UI says
   * so plainly rather than implying someone received it.
   */
  delivered?: boolean;
};

export const initialEnquiryState: EnquiryState = { status: 'idle' };
