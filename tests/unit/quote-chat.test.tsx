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

  it('stays out of the way on the contact page, where the full forms already are', () => {
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
    expect(log).toHaveTextContent(/what can we help you paint/i);
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
  it('asks the next question once the audience is chosen', async () => {
    const user = await openChat();

    await user.click(screen.getByRole('button', { name: 'My home' }));

    expect(screen.getByRole('log')).toHaveTextContent(/whereabouts is the property/i);
    expect(screen.getByLabelText('Suburb')).toBeInTheDocument();
  });

  it('branches to the commercial questions for a business', async () => {
    const user = await openChat();

    await user.click(screen.getByRole('button', { name: 'A business or facility' }));

    expect(screen.getByLabelText('Organisation')).toBeInTheDocument();
  });

  it('refuses to advance on an answer the server would reject', async () => {
    const user = await openChat();
    await user.click(screen.getByRole('button', { name: 'My home' }));

    await user.type(screen.getByLabelText('Suburb'), 'a');
    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText('Enter your suburb.')).toBeInTheDocument();
    expect(screen.getByLabelText('Suburb')).toHaveAttribute('aria-invalid', 'true');
    // Still on the same question.
    expect(screen.getByRole('log')).not.toHaveTextContent(/what needs painting/i);
  });

  it('lets the visitor correct a wrong turn', async () => {
    const user = await openChat();
    await user.click(screen.getByRole('button', { name: 'My home' }));

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByRole('button', { name: 'My home' })).toBeInTheDocument();
  });

  it('skips a question the schema says is optional', async () => {
    const user = await openChat();
    await user.click(screen.getByRole('button', { name: 'A business or facility' }));
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
    expect(screen.getByRole('button', { name: 'My home' })).toBeInTheDocument();
  });

  it('does not count an answered question as a step in the quote', async () => {
    const user = await openChat();

    await user.click(
      screen.getByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    );
    await user.click(screen.getByRole('button', { name: 'My home' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Question 2 of 7');
  });

  it('folds the question list away once one is answered, so the answer has room', async () => {
    const user = await openChat();

    await user.click(
      screen.getByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    );

    expect(
      screen.queryByRole('button', { name: 'Do I need to move out?' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ask something else/i })).toBeInTheDocument();
  });

  it('brings the question list back on request', async () => {
    const user = await openChat();

    await user.click(
      screen.getByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    );
    await user.click(screen.getByRole('button', { name: /ask something else/i }));

    expect(screen.getByRole('button', { name: 'Do I need to move out?' })).toBeInTheDocument();
  });

  it('stops offering questions once the visitor is answering them', async () => {
    const user = await openChat();

    await user.click(screen.getByRole('button', { name: 'My home' }));

    expect(
      screen.queryByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    ).not.toBeInTheDocument();
  });
});

describe('submitting', () => {
  /** Drives the residential branch end to end. */
  async function completeResidential() {
    const user = await openChat();

    await user.click(screen.getByRole('button', { name: 'My home' }));
    await user.type(screen.getByLabelText('Suburb'), 'Chirnside Park');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.click(screen.getByRole('button', { name: 'Both' }));
    await user.click(screen.getByRole('button', { name: 'House' }));
    await user.click(screen.getByRole('button', { name: 'As soon as possible' }));

    await user.type(
      screen.getByLabelText(/about the job/i),
      'Weatherboard exterior plus three bedrooms inside.',
    );
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.type(screen.getByLabelText('Your name'), 'Sam Taylor');
    await user.type(screen.getByLabelText('Phone'), '0400 000 000');
    await user.type(screen.getByLabelText('Email'), 'sam@example.com');
    await user.click(screen.getByRole('button', { name: /send enquiry/i }));

    return user;
  }

  it('hands over every answer the visitor gave', async () => {
    await completeResidential();

    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1));

    const data = submitSpy.mock.calls[0]?.[1] as FormData;
    expect(Object.fromEntries(data)).toMatchObject({
      formType: 'residential',
      suburb: 'Chirnside Park',
      workType: 'both',
      propertyType: 'house',
      timeframe: 'asap',
      description: 'Weatherboard exterior plus three bedrooms inside.',
      name: 'Sam Taylor',
      phone: '0400 000 000',
      email: 'sam@example.com',
      company_website: '',
    });
  });

  it('submits through the same anti-spam checks as the forms', async () => {
    await completeResidential();
    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1));

    const data = submitSpy.mock.calls[0]?.[1] as FormData;
    expect(Number(data.get('renderedAt'))).toBeGreaterThan(0);
  });

  it('never counts past the last question', async () => {
    await completeResidential();

    // The residential branch is the opening question plus six more.
    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).not.toHaveTextContent(/Question 8 of 7/);
    expect(screen.getByRole('dialog')).not.toHaveTextContent(/Question 7 of 7/);
  });

  it('says plainly that nothing was delivered when no transport is configured', async () => {
    await completeResidential();

    expect(await screen.findByRole('status')).toHaveTextContent(/were not sent/i);
    expect(screen.getByRole('status')).toHaveTextContent('1300 97 97 40');
  });

  it('confirms delivery only when the server confirms it', async () => {
    submitSpy.mockResolvedValue({
      status: 'success',
      delivered: true,
      message: 'Thanks — your enquiry is with us. We will be in touch shortly.',
    });

    await completeResidential();

    expect(await screen.findByRole('status')).toHaveTextContent(/your enquiry is with us/i);
  });

  it('surfaces a server rejection instead of pretending it worked', async () => {
    submitSpy.mockResolvedValue({
      status: 'error',
      message: 'Too many enquiries from this connection.',
    });

    await completeResidential();

    expect(await screen.findByRole('status')).toHaveTextContent(/too many enquiries/i);
  });
});
