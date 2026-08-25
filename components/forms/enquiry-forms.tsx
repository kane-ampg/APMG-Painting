'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { submitEnquiry } from '@/app/actions/enquiry';
import { initialEnquiryState } from '@/lib/enquiry/state';
import { CheckboxField, Honeypot, SelectField, TextAreaField, TextField } from './fields';
import { FormStatus } from './form-status';
import { COMMERCIAL_PROPERTY_TYPES, COMMERCIAL_TIMEFRAMES } from '@/lib/enquiry/options';
import { Button } from '@/components/ui';

/**
 * The commercial enquiry form.
 *
 * Built on a Server Action via useActionState, so it submits and validates
 * with JavaScript disabled — the progressive-enhancement requirement. The
 * client adds a pending state and focus management, nothing load-bearing.
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
          options={COMMERCIAL_PROPERTY_TYPES}
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
        options={COMMERCIAL_TIMEFRAMES}
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
