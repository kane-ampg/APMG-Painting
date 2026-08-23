'use client';

import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Form field primitives.
 *
 * Every field gets a real, visible <label> bound by id. The live WordPress form
 * has zero <label> elements and zero aria-label attributes — placeholder-only —
 * which fails WCAG 1.3.1 and 3.3.2 and loses the field name the moment someone
 * starts typing. That defect cannot recur here: the label is a required prop.
 *
 * Errors are bound with aria-describedby and marked aria-invalid, and are
 * conveyed in text, never by colour alone.
 */

type FieldShellProps = {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
  required?: boolean;
  children: (props: {
    id: string;
    name: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => ReactNode;
};

function FieldShell({ label, name, errors, hint, required, children }: FieldShellProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const invalid = Boolean(errors && errors.length > 0);

  const describedBy =
    [hint ? hintId : null, invalid ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-signal-600" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1 font-normal text-ink-muted">(optional)</span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}

      {children({ id, name, describedBy, invalid })}

      {invalid && (
        <p id={errorId} className="text-sm font-medium text-red-700">
          {errors?.[0]}
        </p>
      )}
    </div>
  );
}

const controlClass =
  'w-full rounded-md border bg-white px-3 py-2.5 text-base text-ink placeholder:text-ink-muted/70 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600';

export function TextField({
  label,
  name,
  errors,
  hint,
  required = true,
  ...rest
}: {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
  required?: boolean;
} & Omit<ComponentProps<'input'>, 'name' | 'id'>) {
  return (
    <FieldShell label={label} name={name} errors={errors} hint={hint} required={required}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          name={name}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(controlClass, invalid ? 'border-red-700' : 'border-paper-edge')}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  name,
  errors,
  hint,
  required = true,
  rows = 5,
  ...rest
}: {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
  required?: boolean;
} & Omit<ComponentProps<'textarea'>, 'name' | 'id'>) {
  return (
    <FieldShell label={label} name={name} errors={errors} hint={hint} required={required}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          name={name}
          rows={rows}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(controlClass, invalid ? 'border-red-700' : 'border-paper-edge')}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export function SelectField({
  label,
  name,
  errors,
  hint,
  required = true,
  options,
  ...rest
}: {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
  required?: boolean;
  options: readonly { value: string; label: string }[];
} & Omit<ComponentProps<'select'>, 'name' | 'id'>) {
  return (
    <FieldShell label={label} name={name} errors={errors} hint={hint} required={required}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          name={name}
          required={required}
          defaultValue=""
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(controlClass, invalid ? 'border-red-700' : 'border-paper-edge')}
          {...rest}
        >
          <option value="" disabled>
            Please choose…
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  name,
  hint,
}: {
  label: string;
  name: string;
  hint?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        value="true"
        aria-describedby={hint ? hintId : undefined}
        className="mt-1 h-4 w-4 shrink-0 rounded border-paper-edge text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      />
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {hint && (
          <p id={hintId} className="text-xs text-ink-muted">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Honeypot. Hidden from sighted users AND from assistive tech, so only a bot
 * fills it. Not `display:none` alone — some bots skip those.
 */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
      <label htmlFor="company_website">Company website — leave this field empty</label>
      <input
        id="company_website"
        name="company_website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
