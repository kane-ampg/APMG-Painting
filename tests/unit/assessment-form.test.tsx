import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteAssessmentForm } from '@/components/forms/enquiry-forms';
import { SiteSettingsProvider } from '@/components/providers/site-settings';
import { defaultSiteSettings } from '@/lib/site';

/**
 * The booking form on the contact page.
 *
 * The one rule the form has to enforce for itself is the Melbourne one: an
 * on-site visit is offered only when the visitor says the site is in
 * metropolitan Melbourne. The server refuses the combination regardless; the
 * form stops a visitor choosing it in the first place.
 */

vi.mock('@/app/actions/enquiry', () => ({
  submitEnquiry: vi.fn(async () => ({ status: 'idle' })),
}));

beforeEach(() => {
  render(
    <SiteSettingsProvider value={defaultSiteSettings}>
      <SiteAssessmentForm />
    </SiteSettingsProvider>,
  );
});

describe('the on-site option follows the site region', () => {
  it('offers both assessment types once the site is in Melbourne', async () => {
    const user = userEvent.setup();

    await user.click(screen.getByLabelText('Metropolitan Melbourne'));

    expect(screen.getByLabelText(/on-site visit/i)).toBeEnabled();
    expect(screen.getByLabelText(/online assessment/i)).toBeEnabled();
  });

  it('disables the on-site visit outside Melbourne and says why', async () => {
    const user = userEvent.setup();

    await user.click(screen.getByLabelText('Elsewhere in Victoria'));

    expect(screen.getByLabelText(/on-site visit/i)).toBeDisabled();
    expect(screen.getByText(/melbourne-only for now/i)).toBeInTheDocument();
  });

  it('moves a visitor who had picked on-site over to online when they change region', async () => {
    const user = userEvent.setup();

    await user.click(screen.getByLabelText('Metropolitan Melbourne'));
    await user.click(screen.getByLabelText(/on-site visit/i));
    await user.click(screen.getByLabelText('Interstate'));

    expect(screen.getByLabelText(/on-site visit/i)).not.toBeChecked();
    expect(screen.getByLabelText(/online assessment/i)).toBeChecked();
  });
});

describe('the form asks for a booking, not a quote', () => {
  it('does not ask the visitor to choose a representative', () => {
    expect(screen.queryByLabelText(/representative/i)).not.toBeInTheDocument();
  });

  it('asks when suits, because the time is confirmed by email', () => {
    expect(screen.getByLabelText(/preferred times/i)).toBeInTheDocument();
  });

  it('asks for a work email address', () => {
    expect(screen.getByLabelText(/work email/i)).toHaveAttribute('type', 'email');
  });

  it('no longer demands a scope summary or timeframe up front', () => {
    expect(screen.queryByLabelText(/scope summary/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/timeframe/i)).not.toBeInTheDocument();
  });

  it('submits as a booking', () => {
    expect(screen.getByRole('button', { name: /book my assessment/i })).toBeInTheDocument();
  });
});
