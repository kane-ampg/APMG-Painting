'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitEnquiry } from '@/app/actions/enquiry';
import { initialEnquiryState } from '@/lib/enquiry/state';
import { Honeypot, RadioGroupField, SelectField, TextAreaField, TextField } from './fields';
import { FormStatus } from './form-status';
import {
  ASSESSMENT_TYPES,
  COMMERCIAL_PROPERTY_TYPES,
  SITE_REGIONS,
  availableOptions,
} from '@/lib/enquiry/options';
import { Button } from '@/components/ui';

/**
 * The free site assessment booking form.
 *
 * Built on a Server Action via useActionState, so it submits and validates
 * with JavaScript disabled — the progressive-enhancement requirement. The
 * client adds a pending state, focus management and one convenience: the
 * on-site option is disabled the moment a visitor says the site is outside
 * Melbourne, instead of being accepted here and refused by the server. With
 * JavaScript off the server's own rule still applies.
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

const ONSITE_NOTE =
  'On-site visits are Melbourne-only for now. Everywhere else we start with an online assessment and take it from there.';

export function SiteAssessmentForm() {
  const [state, formAction] = useActionState(submitEnquiry, initialEnquiryState);
  const [region, setRegion] = useState('');
  const [assessmentType, setAssessmentType] = useState('');

  const offered = availableOptions(ASSESSMENT_TYPES, { siteRegion: region }).map((o) => o.value);
  // Nothing is withheld until a region is chosen: the server decides then.
  const withheld =
    region === '' ? [] : ASSESSMENT_TYPES.map((o) => o.value).filter((v) => !offered.includes(v));

  function chooseRegion(next: string) {
    setRegion(next);
    const stillOffered = availableOptions(ASSESSMENT_TYPES, { siteRegion: next }).map(
      (o) => o.value,
    );
    if (assessmentType !== '' && !stillOffered.includes(assessmentType)) {
      setAssessmentType(stillOffered[0] ?? '');
    }
  }

  const addressHint =
    assessmentType === 'online'
      ? 'A suburb is enough for an online assessment.'
      : 'Street address, suburb and postcode, so we know exactly where to come.';

  return (
    <form action={formAction} className="relative flex flex-col gap-6" noValidate>
      <input type="hidden" name="formType" value="commercial" />
      <RenderedAtField />
      <Honeypot />

      <FormStatus status={state.status} message={state.message} delivered={state.delivered} />

      <RadioGroupField
        label="Where is the site?"
        name="siteRegion"
        options={SITE_REGIONS}
        value={region}
        onChange={chooseRegion}
        errors={state.errors?.siteRegion}
      />

      <RadioGroupField
        label="How would you like us to do the assessment?"
        name="assessmentType"
        options={ASSESSMENT_TYPES}
        value={assessmentType}
        onChange={setAssessmentType}
        disabledValues={withheld}
        disabledNote={ONSITE_NOTE}
        errors={state.errors?.assessmentType}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Property or sector type"
          name="propertyType"
          errors={state.errors?.propertyType}
          options={COMMERCIAL_PROPERTY_TYPES}
        />
        <TextField
          label="Site address"
          name="siteAddress"
          autoComplete="street-address"
          hint={addressHint}
          errors={state.errors?.siteAddress}
        />
      </div>

      <TextAreaField
        label="Preferred times"
        name="preferredTimes"
        rows={3}
        hint="Two or three windows that suit you, e.g. Tuesday morning or Thursday after 2pm. We confirm by email, with a Google Meet link for online assessments."
        errors={state.errors?.preferredTimes}
      />

      <TextAreaField
        label="Notes"
        name="notes"
        required={false}
        rows={3}
        hint="Access, sign-in, what needs painting — whatever helps us arrive prepared."
        errors={state.errors?.notes}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Organisation"
          name="organisation"
          autoComplete="organization"
          errors={state.errors?.organisation}
        />
        <TextField label="Your name" name="name" autoComplete="name" errors={state.errors?.name} />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          errors={state.errors?.phone}
        />
        <TextField
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          hint="Where we send the confirmation."
          errors={state.errors?.email}
        />
      </div>

      <SubmitButton>Book my assessment</SubmitButton>
    </form>
  );
}
