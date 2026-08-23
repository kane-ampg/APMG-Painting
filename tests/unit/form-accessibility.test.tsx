import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SelectField, TextAreaField, TextField } from '@/components/forms/fields';

/**
 * The live WordPress enquiry form has zero <label> elements and zero
 * aria-label attributes — every field is placeholder-only, which fails
 * WCAG 1.3.1 and 3.3.2 and loses the field name as soon as someone types.
 *
 * These tests exist so that defect cannot come back.
 */
describe('form fields are labelled', () => {
  it('associates a text field with a real label', () => {
    render(<TextField label="Your name" name="name" />);
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
  });

  it('associates a textarea with a real label', () => {
    render(<TextAreaField label="Scope summary" name="scopeSummary" />);
    expect(screen.getByLabelText(/scope summary/i)).toBeInTheDocument();
  });

  it('associates a select with a real label', () => {
    render(
      <SelectField
        label="Property type"
        name="propertyType"
        options={[{ value: 'house', label: 'House' }]}
      />,
    );
    expect(screen.getByLabelText(/property type/i)).toBeInTheDocument();
  });

  it('marks optional fields so required is unambiguous', () => {
    render(<TextField label="Notes" name="notes" required={false} />);
    expect(screen.getByText(/\(optional\)/i)).toBeInTheDocument();
  });
});

describe('form errors are announced, not just coloured', () => {
  it('renders the error text and links it via aria-describedby', () => {
    render(<TextField label="Email" name="email" errors={['Enter a valid email address.']} />);

    const input = screen.getByLabelText(/email/i);
    const message = screen.getByText('Enter a valid email address.');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain(message.id);
  });

  it('does not mark a valid field as invalid', () => {
    render(<TextField label="Email" name="email" />);
    expect(screen.getByLabelText(/email/i)).not.toHaveAttribute('aria-invalid');
  });

  it('exposes hint text to assistive technology', () => {
    render(<TextField label="Phone" name="phone" hint="Mobile or landline." />);
    const input = screen.getByLabelText(/phone/i);
    const hint = screen.getByText('Mobile or landline.');
    expect(input.getAttribute('aria-describedby')).toContain(hint.id);
  });
});
