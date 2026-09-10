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
          <span className="ml-1 text-brand-600" aria-hidden="true">
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
  'transition-[border-color,box-shadow] duration-200 ease-decel motion-reduce:transition-none ' +
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
        /*
         * The select is wrapped so a chevron can sit over it. The native arrow
         * is hidden (`appearance-none`) because it cannot be styled or
         * animated; ours turns as the list opens. `pointer-events-none` on the
         * chevron keeps every click on the control underneath it.
         *
         * `.select-control` in globals.css opts modern browsers into the
         * customisable select, where the list itself fades and drops in. Where
         * that is unsupported the browser keeps its own list and only the
         * trigger is styled here.
         */
        <div className="group relative">
          <select
            id={id}
            name={name}
            required={required}
            defaultValue=""
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(
              controlClass,
              'select-control cursor-pointer appearance-none truncate pr-10',
              'hover:border-brand-600',
              invalid ? 'border-red-700' : 'border-paper-edge',
            )}
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
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted',
              'transition-transform duration-200 ease-decel motion-reduce:transition-none',
              'group-has-[select:open]:rotate-180 group-has-[select:focus-visible]:text-brand-700',
            )}
          >
            <path d="m5 7.5 5 5 5-5" />
          </svg>
        </div>
      )}
    </FieldShell>
  );
}

/**
 * A radio group. A <fieldset> with a real <legend>, one labelled radio per
 * option, and the hint and error bound to the group rather than to a single
 * radio — the error is about the choice, not about one button.
 *
 * Controlled when `value` is given, so a form can react to the choice (the
 * booking form disables the on-site visit outside Melbourne). Uncontrolled
 * otherwise, and either way it posts with JavaScript disabled.
 */
export function RadioGroupField({
  label,
  name,
  options,
  errors,
  hint,
  required = true,
  value,
  onChange,
  disabledValues = [],
  disabledNote,
}: {
  label: string;
  name: string;
  options: readonly { value: string; label: string; description?: string }[];
  errors?: string[];
  hint?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  /** Options shown but not selectable, with `disabledNote` explaining why. */
  disabledValues?: readonly string[];
  disabledNote?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const noteId = `${id}-note`;
  const invalid = Boolean(errors && errors.length > 0);
  const anyDisabled = options.some((option) => disabledValues.includes(option.value));

  const describedBy =
    [hint ? hintId : null, anyDisabled && disabledNote ? noteId : null, invalid ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={describedBy}>
      <legend className="text-sm font-semibold text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-brand-600" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1 font-normal text-ink-muted">(optional)</span>
        )}
      </legend>

      {hint && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const disabled = disabledValues.includes(option.value);
          const checked = value === undefined ? undefined : value === option.value;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-md border bg-white px-3 py-2.5 text-sm text-ink',
                'has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600',
                disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-brand-600',
                invalid ? 'border-red-700' : 'border-paper-edge',
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                required={required}
                disabled={disabled}
                checked={checked}
                onChange={onChange ? () => onChange(option.value) : undefined}
                className="mt-0.5 h-4 w-4 shrink-0 border-paper-edge text-brand-700 focus-visible:outline-none"
              />
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-ink-muted">{option.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {anyDisabled && disabledNote && (
        <p id={noteId} className="text-xs text-ink-soft">
          {disabledNote}
        </p>
      )}

      {invalid && (
        <p id={errorId} className="text-sm font-medium text-red-700">
          {errors?.[0]}
        </p>
      )}
    </fieldset>
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
