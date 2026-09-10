import 'server-only';
import type { Enquiry } from '@/lib/validation/enquiry';
import {
  ASSESSMENT_TYPES,
  COMMERCIAL_PROPERTY_TYPES,
  SITE_REGIONS,
  type EnquiryOption,
} from '@/lib/enquiry/options';

/**
 * Booking delivery.
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
    assessmentType: enquiry.assessmentType,
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

    const { subject, body } = describeRequest(enquiry);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, text: body }),
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

function labelOf(options: readonly EnquiryOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/**
 * The email a booking becomes.
 *
 * The subject is how the team triages an inbox, so it says what was booked
 * and by whom. The body reads back the labels the visitor saw rather than the
 * enum values the server stored — `On-site visit`, not `onsite`.
 */
export function describeRequest(enquiry: Enquiry): { subject: string; body: string } {
  const assessmentType = labelOf(ASSESSMENT_TYPES, enquiry.assessmentType);

  const subject = `Site assessment request — ${assessmentType} — ${enquiry.name}, ${enquiry.organisation}`;

  const lines: (readonly [string, string])[] = [
    ['Assessment type', assessmentType],
    ['Site region', labelOf(SITE_REGIONS, enquiry.siteRegion)],
    ['Sector', labelOf(COMMERCIAL_PROPERTY_TYPES, enquiry.propertyType)],
    ['Site address', enquiry.siteAddress],
    ['Preferred times', enquiry.preferredTimes],
    ['Notes', enquiry.notes || '—'],
    ['Organisation', enquiry.organisation],
    ['Name', enquiry.name],
    ['Phone', enquiry.phone],
    ['Email', enquiry.email],
  ];

  return { subject, body: lines.map(([key, value]) => `${key}: ${value}`).join('\n') };
}

export function getEnquiryTransport(): EnquiryTransport {
  return process.env.ENQUIRY_TRANSPORT === 'resend' ? resendTransport : consoleTransport;
}
