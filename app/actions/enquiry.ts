'use server';

import { headers } from 'next/headers';
import { getSiteSettings } from '@/lib/content/source';
import { checkRateLimit } from '@/lib/enquiry/rate-limit';
import type { EnquiryState } from '@/lib/enquiry/state';
import { getEnquiryTransport } from '@/lib/enquiry/transport';
import { MIN_COMPLETION_SECONDS, commercialEnquirySchema } from '@/lib/validation/enquiry';

async function clientKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
  return ip;
}

export async function submitEnquiry(
  _previous: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const parsed = commercialEnquirySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    // Honeypot rejections look identical to validation failures from outside.
    return {
      status: 'error',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      message: 'Please check the highlighted fields and try again.',
    };
  }

  const enquiry = parsed.data;

  // Timing check — a human cannot complete this form in under a few seconds.
  const elapsedSeconds = (Date.now() - enquiry.renderedAt) / 1000;
  if (elapsedSeconds < MIN_COMPLETION_SECONDS) {
    return {
      status: 'error',
      message: 'That submission looked automated. Please try again.',
    };
  }

  // The number a rejected visitor is told to ring is the editable one, not a
  // literal: FormStatus reads it from the settings context, and a Server
  // Action message that disagreed with it would send people to the old line.
  //
  // Read inside the two failure branches rather than up front. It is a
  // database round trip on the path of every submission otherwise, and the
  // one thing it must never do is cost somebody their enquiry — the happy
  // path does not need a phone number at all.
  const limit = checkRateLimit(await clientKey());
  if (!limit.allowed) {
    const { phone } = await getSiteSettings();
    return {
      status: 'error',
      message: `Too many enquiries from this connection. Please try again in ${Math.ceil(
        limit.retryAfterSeconds / 60,
      )} minutes, or call us on ${phone}.`,
    };
  }

  const result = await getEnquiryTransport().send(enquiry);

  if (!result.delivered && result.reason === 'provider-error') {
    const { phone } = await getSiteSettings();
    return {
      status: 'error',
      message: `We could not send your enquiry just now. Please call us on ${phone} and we will pick it up straight away.`,
    };
  }

  return {
    status: 'success',
    delivered: result.delivered,
    message: result.delivered
      ? 'Thanks — your enquiry is with us. We will be in touch shortly.'
      : undefined,
  };
}
