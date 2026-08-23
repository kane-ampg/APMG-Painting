import 'server-only';
import type { Enquiry } from '@/lib/validation/enquiry';

/**
 * Enquiry delivery.
 *
 * No production email or CRM credentials exist for this project yet, and where
 * Contact Form 7 submissions currently land on the WordPress site is unknown.
 * Rather than pretend, this is an adapter interface with two implementations:
 *
 *   console  — the default. Records that a submission happened. Delivers nothing.
 *   resend   — a real provider, active only once RESEND_API_KEY is configured.
 *
 * The console adapter reports `delivered: false`, and the UI tells the user to
 * phone instead. The site never claims a message was sent when it was not.
 */

export type TransportResult =
  { delivered: true } | { delivered: false; reason: 'not-configured' | 'provider-error' };

export interface EnquiryTransport {
  readonly id: string;
  send(enquiry: Enquiry): Promise<TransportResult>;
}

/**
 * Fields that must never reach a log. Customer contact details and free text
 * are business data, not diagnostics.
 */
function redact(enquiry: Enquiry): Record<string, unknown> {
  return {
    formType: enquiry.formType,
    // A count, not the content.
    fieldsSubmitted: Object.keys(enquiry).length,
  };
}

const consoleTransport: EnquiryTransport = {
  id: 'console',
  async send(enquiry) {
    // Redacted by construction — no name, phone, email or free text.
    console.info('[enquiry] received', redact(enquiry));
    return { delivered: false, reason: 'not-configured' };
  },
};

const resendTransport: EnquiryTransport = {
  id: 'resend',
  async send(enquiry) {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.ENQUIRY_TO_EMAIL;
    const from = process.env.ENQUIRY_FROM_EMAIL;

    if (!apiKey || !to || !from) {
      return { delivered: false, reason: 'not-configured' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject: `New ${enquiry.formType} enquiry — ${enquiry.name}`,
          text: formatEnquiry(enquiry),
        }),
      });

      if (!response.ok) {
        // Status only. The response body can echo submitted content.
        console.error('[enquiry] provider rejected send', { status: response.status });
        return { delivered: false, reason: 'provider-error' };
      }

      return { delivered: true };
    } catch {
      console.error('[enquiry] provider request failed');
      return { delivered: false, reason: 'provider-error' };
    }
  },
};

function formatEnquiry(enquiry: Enquiry): string {
  const lines: string[] = [`Enquiry type: ${enquiry.formType}`, ''];
  for (const [key, value] of Object.entries(enquiry)) {
    if (key === 'company_website' || key === 'renderedAt' || key === 'formType') continue;
    lines.push(`${key}: ${String(value)}`);
  }
  return lines.join('\n');
}

export function getEnquiryTransport(): EnquiryTransport {
  return process.env.ENQUIRY_TRANSPORT === 'resend' ? resendTransport : consoleTransport;
}
