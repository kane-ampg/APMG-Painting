import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteChat } from '@/components/chat/quote-chat';

/**
 * The floating quote chat.
 *
 * A second route into the same enquiry pipeline, so the things that matter are:
 * it is reachable and dismissable by keyboard, it refuses to advance on an
 * answer the server would reject, it submits exactly what was answered, and it
 * repeats the site's promise not to claim a delivery that did not happen.
 */

const { pathname, submitSpy } = vi.hoisted(() => ({
  pathname: { current: '/' },
  submitSpy: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.current,
}));

// A Server Action cannot execute in jsdom. The widget's observable behaviour is
// the payload it hands over, so that is what these tests assert on.
vi.mock('@/app/actions/enquiry', () => ({
  submitEnquiry: (previous: unknown, formData: FormData) => submitSpy(previous, formData),
}));

beforeEach(() => {
  pathname.current = '/';
  submitSpy.mockReset();
  submitSpy.mockResolvedValue({ status: 'success', delivered: false });
  window.sessionStorage.clear();
});

const launcher = () => screen.getByRole('button', { name: /get a quote|chat/i });

async function openChat() {
  const user = userEvent.setup();
  render(<QuoteChat />);
  await user.click(launcher());
  return user;
}

describe('the launcher', () => {
  it('starts closed, so it never blocks the page on arrival', () => {
    render(<QuoteChat />);
    expect(launcher()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the conversation when activated', async () => {
    await openChat();
    expect(launcher()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('points at the panel it controls', async () => {
    await openChat();
    expect(launcher().getAttribute('aria-controls')).toBe(screen.getByRole('dialog').id);
  });

  it('stays out of the way on the contact page, where the full form already is', () => {
    pathname.current = '/contact-us/';
    render(<QuoteChat />);
    expect(screen.queryByRole('button', { name: /get a quote|chat/i })).not.toBeInTheDocument();
  });
});

describe('keyboard and assistive-technology access', () => {
  it('closes on Escape and hands focus back to the launcher', async () => {
    const user = await openChat();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(launcher()).toHaveFocus();
  });

  it('moves focus into the panel on open, rather than leaving it behind', async () => {
    await openChat();
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
  });

  it('announces each new turn in a polite live region', async () => {
    await openChat();
    const log = screen.getByRole('log');
    expect(log).toHaveAttribute('aria-live', 'polite');
    expect(log).toHaveTextContent(/which organisation are you with/i);
  });

  it('offers the phone number as a way out at every turn', async () => {
    await openChat();
    expect(screen.getByRole('link', { name: /1300 97 97 40/ })).toHaveAttribute(
      'href',
      'tel:1300979740',
    );
  });
});

describe('walking the conversation', () => {
  it('opens straight on the flow’s first question — there is no audience choice to make', async () => {
    await openChat();

    expect(screen.getByLabelText('Organisation')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /my home|a business or facility/i }),
    ).not.toBeInTheDocument();
  });

  it('asks the next question once the organisation is given', async () => {
    const user = await openChat();

    await user.type(screen.getByLabelText('Organisation'), 'Ramset Aged Care');
    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByRole('log')).toHaveTextContent(/what kind of site is it/i);
    expect(screen.getByRole('button', { name: 'School or childcare' })).toBeInTheDocument();
  });

  it('refuses to advance on an answer the server would reject', async () => {
    const user = await openChat();

    await user.type(screen.getByLabelText('Organisation'), 'a');
    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText('Enter your organisation.')).toBeInTheDocument();
    expect(screen.getByLabelText('Organisation')).toHaveAttribute('aria-invalid', 'true');
    // Still on the same question.
    expect(screen.getByRole('log')).not.toHaveTextContent(/what kind of site is it/i);
  });

  it('lets the visitor correct a wrong turn', async () => {
    const user = await openChat();

    await user.type(screen.getByLabelText('Organisation'), 'Ramset Aged Care');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.click(screen.getByRole('button', { name: /^back$/i }));

    expect(screen.getByLabelText('Organisation')).toHaveValue('Ramset Aged Care');
  });

  it('skips a question the schema says is optional', async () => {
    const user = await openChat();

    await user.type(screen.getByLabelText('Organisation'), 'Ramset Aged Care');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: 'Aged care or retirement living' }));
    await user.type(screen.getByLabelText('Project location'), 'Chirnside Park');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.type(screen.getByLabelText('Scope summary'), 'Two resident wings and common areas.');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: 'Going to tender' }));

    expect(screen.getByLabelText(/operating-hours constraints/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /skip/i }));

    expect(screen.getByRole('log')).toHaveTextContent(/attend site before quoting/i);
  });
});

describe('answering a question without starting a quote', () => {
  it('offers the common questions on the opening turn', async () => {
    await openChat();
    expect(
      screen.getByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    ).toBeInTheDocument();
  });

  it('answers with the published answer, and keeps the quote flow available', async () => {
    const user = await openChat();

    await user.click(
      screen.getByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    );

    expect(screen.getByRole('log')).toHaveTextContent(/metropolitan Melbourne from our base/i);
    expect(screen.getByLabelText('Organisation')).toBeInTheDocument();
  });

  it('does not count an answered question as a step in the quote', async () => {
    const user = await openChat();

    await user.click(
      screen.getByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Question 1 of 8');
  });

  it('folds the question list away once one is answered, so the answer has room', async () => {
    const user = await openChat();

    await user.click(
      screen.getByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    );

    expect(
      screen.queryByRole('button', { name: 'What documentation do you provide before starting?' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ask something else/i })).toBeInTheDocument();
  });

  it('brings the question list back on request', async () => {
    const user = await openChat();

    await user.click(
      screen.getByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    );
    await user.click(screen.getByRole('button', { name: /ask something else/i }));

    expect(
      screen.getByRole('button', { name: 'What documentation do you provide before starting?' }),
    ).toBeInTheDocument();
  });

  it('stops offering questions once the visitor moves past the opening question', async () => {
    const user = await openChat();

    await user.type(screen.getByLabelText('Organisation'), 'Ramset Aged Care');
    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(
      screen.queryByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    ).not.toBeInTheDocument();
  });
});

describe('submitting', () => {
  /** Drives the (only) commercial branch end to end. */
  async function completeCommercial() {
    const user = await openChat();

    await user.type(screen.getByLabelText('Organisation'), 'Ramset Aged Care');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.click(screen.getByRole('button', { name: 'Aged care or retirement living' }));

    await user.type(screen.getByLabelText('Project location'), 'Chirnside Park');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.type(
      screen.getByLabelText('Scope summary'),
      'Repaint of two resident wings and the common areas.',
    );
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.click(screen.getByRole('button', { name: 'Going to tender' }));

    await user.type(screen.getByLabelText(/operating-hours constraints/i), 'After 6pm only.');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.click(screen.getByRole('button', { name: 'Yes, please' }));

    await user.type(screen.getByLabelText('Your name'), 'Sam Taylor');
    await user.type(screen.getByLabelText('Phone'), '0400 000 000');
    await user.type(screen.getByLabelText('Email'), 'sam@example.com');
    await user.click(screen.getByRole('button', { name: /send enquiry/i }));

    return user;
  }

  it('hands over every answer the visitor gave', async () => {
    await completeCommercial();

    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1));

    const data = submitSpy.mock.calls[0]?.[1] as FormData;
    expect(Object.fromEntries(data)).toMatchObject({
      formType: 'commercial',
      organisation: 'Ramset Aged Care',
      propertyType: 'aged-care-and-retirement',
      projectLocation: 'Chirnside Park',
      scopeSummary: 'Repaint of two resident wings and the common areas.',
      timeframe: 'tender',
      operatingHoursConstraints: 'After 6pm only.',
      siteAssessmentRequested: 'true',
      name: 'Sam Taylor',
      phone: '0400 000 000',
      email: 'sam@example.com',
      company_website: '',
    });
  });

  it('submits through the same anti-spam checks as the form', async () => {
    await completeCommercial();
    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1));

    const data = submitSpy.mock.calls[0]?.[1] as FormData;
    expect(Number(data.get('renderedAt'))).toBeGreaterThan(0);
  });

  it('never counts past the last question', async () => {
    await completeCommercial();

    // The commercial branch is the eight steps in lib/enquiry/chat-flow.ts.
    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).not.toHaveTextContent(/Question 9 of 8/);
    expect(screen.getByRole('dialog')).not.toHaveTextContent(/Question 8 of 8/);
  });

  it('says plainly that nothing was delivered when no transport is configured', async () => {
    await completeCommercial();

    expect(await screen.findByRole('status')).toHaveTextContent(/were not sent/i);
    expect(screen.getByRole('status')).toHaveTextContent('1300 97 97 40');
  });

  it('confirms delivery only when the server confirms it', async () => {
    submitSpy.mockResolvedValue({
      status: 'success',
      delivered: true,
      message: 'Thanks — your enquiry is with us. We will be in touch shortly.',
    });

    await completeCommercial();

    expect(await screen.findByRole('status')).toHaveTextContent(/your enquiry is with us/i);
  });

  it('surfaces a server rejection instead of pretending it worked', async () => {
    submitSpy.mockResolvedValue({
      status: 'error',
      message: 'Too many enquiries from this connection.',
    });

    await completeCommercial();

    expect(await screen.findByRole('status')).toHaveTextContent(/too many enquiries/i);
  });
});
