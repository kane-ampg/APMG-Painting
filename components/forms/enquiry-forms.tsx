'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { submitEnquiry } from '@/app/actions/enquiry';
import { initialEnquiryState } from '@/lib/enquiry/state';
import { CheckboxField, Honeypot, SelectField, TextAreaField, TextField } from './fields';
import { Button } from '@/components/ui';
import { site } from '@/lib/site';

/**
 * Both enquiry forms.
 *
 * Built on a Server Action via useActionState, so they submit and validate with
 * JavaScript disabled — the progressive-enhancement requirement. The client
 * adds a pending state and focus management, nothing load-bearing.
 */

/**
 * Hidden field carrying the moment the form became interactive, used by the
 * server's minimum-completion-time check.
 *
 * The timestamp is written straight to the DOM node in an effect. Calling
 * Date.now() during render would be impure, and routing it through React state
 * would trigger a cascading render for a value React never needs to read.
 *
 * With JavaScript disabled the value stays 0, which the server reads as an
 * enormous elapsed time and therefore allows. That is deliberate — a no-JS
 * visitor must not be blocked by an anti-bot heuristic. The honeypot still
 * applies to them.
 */
function RenderedAtField() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.value = String(Date.now());
  }, []);

  return <input ref={ref} type="hidden" name="renderedAt" defaultValue="0" />;
}

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Sending…' : children}
    </Button>
  );
}

function FormStatus({
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
          ? 'rounded-md border border-brand-400 bg-brand-50 p-4 text-sm text-brand-900'
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

const TIMEFRAMES_RESIDENTIAL = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '1-3-months', label: 'Within 1–3 months' },
  { value: '3-plus-months', label: 'More than 3 months away' },
  { value: 'planning', label: 'Still planning' },
] as const;

const TIMEFRAMES_COMMERCIAL = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '1-3-months', label: 'Within 1–3 months' },
  { value: '3-plus-months', label: 'More than 3 months away' },
  { value: 'planning', label: 'Still planning' },
  { value: 'tender', label: 'Going to tender' },
] as const;

/* ------------------------------------------------------------------ */
/* Residential                                                          */
/* ------------------------------------------------------------------ */

export function ResidentialEnquiryForm() {
  const [state, formAction] = useActionState(submitEnquiry, initialEnquiryState);

  return (
    <form action={formAction} className="relative flex flex-col gap-5" noValidate>
      <input type="hidden" name="formType" value="residential" />
      <RenderedAtField />
      <Honeypot />

      <FormStatus status={state.status} message={state.message} delivered={state.delivered} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Your name" name="name" autoComplete="name" errors={state.errors?.name} />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          errors={state.errors?.phone}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          errors={state.errors?.email}
        />
        <TextField
          label="Suburb"
          name="suburb"
          autoComplete="address-level2"
          errors={state.errors?.suburb}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Property type"
          name="propertyType"
          errors={state.errors?.propertyType}
          options={[
            { value: 'house', label: 'House' },
            { value: 'apartment', label: 'Apartment' },
            { value: 'townhouse', label: 'Townhouse' },
            { value: 'other', label: 'Something else' },
          ]}
        />
        <SelectField
          label="What needs painting?"
          name="workType"
          errors={state.errors?.workType}
          options={[
            { value: 'interior', label: 'Interior' },
            { value: 'exterior', label: 'Exterior' },
            { value: 'both', label: 'Both' },
          ]}
        />
      </div>

      <SelectField
        label="Approximate timeframe"
        name="timeframe"
        errors={state.errors?.timeframe}
        options={TIMEFRAMES_RESIDENTIAL}
      />

      <TextAreaField
        label="Tell us about the job"
        name="description"
        hint="Rough size, number of rooms, condition of the surfaces — whatever you know."
        errors={state.errors?.description}
      />

      <p className="rounded-md border border-dashed border-paper-edge bg-paper-sunken px-4 py-3 text-xs text-ink-muted">
        Photo upload is not enabled in this preview. It ships once file storage is provisioned, with
        server-side type and size checks.
      </p>

      <SubmitButton>Request a free quote</SubmitButton>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Commercial                                                           */
/* ------------------------------------------------------------------ */

export function CommercialEnquiryForm() {
  const [state, formAction] = useActionState(submitEnquiry, initialEnquiryState);

  return (
    <form action={formAction} className="relative flex flex-col gap-5" noValidate>
      <input type="hidden" name="formType" value="commercial" />
      <RenderedAtField />
      <Honeypot />

      <FormStatus status={state.status} message={state.message} delivered={state.delivered} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Your name" name="name" autoComplete="name" errors={state.errors?.name} />
        <TextField
          label="Organisation"
          name="organisation"
          autoComplete="organization"
          errors={state.errors?.organisation}
        />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          errors={state.errors?.phone}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          errors={state.errors?.email}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Property or sector type"
          name="propertyType"
          errors={state.errors?.propertyType}
          options={[
            { value: 'education-and-childcare', label: 'School or childcare' },
            { value: 'healthcare', label: 'Healthcare or medical' },
            { value: 'aged-care-and-retirement', label: 'Aged care or retirement living' },
            { value: 'body-corporate-and-strata', label: 'Body corporate or strata' },
            { value: 'retail', label: 'Retail' },
            { value: 'hospitality', label: 'Hospitality or venue' },
            { value: 'leisure-and-sports', label: 'Leisure or sports facility' },
            { value: 'industrial', label: 'Industrial or warehouse' },
            { value: 'office', label: 'Office' },
            { value: 'other', label: 'Something else' },
          ]}
        />
        <TextField
          label="Project location"
          name="projectLocation"
          hint="Suburb, or multiple sites."
          errors={state.errors?.projectLocation}
        />
      </div>

      <TextAreaField
        label="Scope summary"
        name="scopeSummary"
        hint="Areas involved, interior or exterior, approximate size, and anything already specified."
        errors={state.errors?.scopeSummary}
      />

      <SelectField
        label="Desired timeframe"
        name="timeframe"
        errors={state.errors?.timeframe}
        options={TIMEFRAMES_COMMERCIAL}
      />

      <TextAreaField
        label="Operating-hours constraints"
        name="operatingHoursConstraints"
        required={false}
        rows={3}
        hint="Trading hours, term dates, shift patterns, after-hours access — whatever limits when we can work."
        errors={state.errors?.operatingHoursConstraints}
      />

      <CheckboxField
        label="Request a site assessment"
        name="siteAssessmentRequested"
        hint="We attend site before quoting commercial work wherever possible."
      />

      <p className="rounded-md border border-dashed border-paper-edge bg-paper-sunken px-4 py-3 text-xs text-ink-muted">
        Scope document upload is not enabled in this preview. It ships once file storage is
        provisioned, with server-side type and size checks.
      </p>

      <SubmitButton>Send enquiry</SubmitButton>
    </form>
  );
}
