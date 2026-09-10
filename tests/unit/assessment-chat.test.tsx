import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssessmentChat } from '@/components/chat/assessment-chat';
import { SiteSettingsProvider } from '@/components/providers/site-settings';
import { defaultSiteSettings } from '@/lib/site';

/**
 * The floating site assessment chat.
 *
 * A second route into the same booking pipeline, so the things that matter are:
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

const launcher = () => screen.getByRole('button', { name: /site assessment|chat/i });

// The widget states the phone number, which lives in the CMS settings and
// reaches client components through the provider the root layout renders.
// The defaults are what the provider carries with no database.
const renderChat = () =>
  render(
    <SiteSettingsProvider value={defaultSiteSettings}>
      <AssessmentChat />
    </SiteSettingsProvider>,
  );

async function openChat() {
  const user = userEvent.setup();
  renderChat();
  await user.click(launcher());
  return user;
}

describe('the launcher', () => {
  it('starts closed, so it never blocks the page on arrival', () => {
    renderChat();
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
    renderChat();
    expect(screen.queryByRole('button', { name: /site assessment|chat/i })).not.toBeInTheDocument();
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
    expect(log).toHaveTextContent(/where is the site/i);
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
  it('opens straight on the first question, where the site is', async () => {
    await openChat();

    expect(screen.getByRole('button', { name: 'Metropolitan Melbourne' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /my home|a business or facility/i }),
    ).not.toBeInTheDocument();
  });

  it('offers an on-site visit or an online assessment once the site is in Melbourne', async () => {
    const user = await openChat();

    await user.click(screen.getByRole('button', { name: 'Metropolitan Melbourne' }));

    expect(screen.getByRole('log')).toHaveTextContent(
      /how would you like us to do the assessment/i,
    );
    expect(screen.getByRole('button', { name: /on-site visit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /online assessment/i })).toBeInTheDocument();
  });

  it('offers online only when the site is outside Melbourne', async () => {
    const user = await openChat();

    await user.click(screen.getByRole('button', { name: 'Interstate' }));

    expect(screen.queryByRole('button', { name: /on-site visit/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /online assessment/i })).toBeInTheDocument();
  });

  it('refuses to advance on an answer the server would reject', async () => {
    const user = await openChat();

    await user.click(screen.getByRole('button', { name: 'Metropolitan Melbourne' }));
    await user.click(screen.getByRole('button', { name: /on-site visit/i }));
    await user.click(screen.getByRole('button', { name: 'Aged care or retirement living' }));
    await user.type(screen.getByLabelText('Site address'), 'x');
    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText(/enter the site address/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Site address')).toHaveAttribute('aria-invalid', 'true');
    // Still on the same question.
    expect(screen.getByRole('log')).not.toHaveTextContent(/when suits you/i);
  });

  it('lets the visitor correct a wrong turn', async () => {
    const user = await openChat();

    await user.click(screen.getByRole('button', { name: 'Metropolitan Melbourne' }));
    await user.click(screen.getByRole('button', { name: /on-site visit/i }));
    await user.click(screen.getByRole('button', { name: 'Aged care or retirement living' }));
    await user.type(screen.getByLabelText('Site address'), '30 Ramset Drive, Chirnside Park');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.click(screen.getByRole('button', { name: /^back$/i }));

    expect(screen.getByLabelText('Site address')).toHaveValue('30 Ramset Drive, Chirnside Park');
  });

  it('skips a question the schema says is optional', async () => {
    const user = await openChat();

    await user.click(screen.getByRole('button', { name: 'Metropolitan Melbourne' }));
    await user.click(screen.getByRole('button', { name: /on-site visit/i }));
    await user.click(screen.getByRole('button', { name: 'Aged care or retirement living' }));
    await user.type(screen.getByLabelText('Site address'), '30 Ramset Drive, Chirnside Park');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.type(screen.getByLabelText('Preferred times'), 'Any weekday after 2pm.');
    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /skip/i }));

    expect(screen.getByRole('log')).toHaveTextContent(/who should we confirm the booking with/i);
  });
});

describe('answering a question without starting a booking', () => {
  it('offers the common questions on the opening turn', async () => {
    await openChat();
    expect(
      screen.getByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    ).toBeInTheDocument();
  });

  it('answers with the published answer, and keeps the booking flow available', async () => {
    const user = await openChat();

    await user.click(
      screen.getByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    );

    expect(screen.getByRole('log')).toHaveTextContent(/metropolitan Melbourne from our base/i);
    expect(screen.getByRole('button', { name: 'Metropolitan Melbourne' })).toBeInTheDocument();
  });

  it('does not count an answered question as a step in the booking', async () => {
    const user = await openChat();

    await user.click(
      screen.getByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Question 1 of 7');
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

    await user.click(screen.getByRole('button', { name: 'Metropolitan Melbourne' }));

    expect(
      screen.queryByRole('button', { name: 'Which areas of Melbourne do you cover?' }),
    ).not.toBeInTheDocument();
  });
});

describe('submitting', () => {
  /** Drives the (only) flow end to end, booking an on-site visit. */
  async function completeBooking() {
    const user = await openChat();

    await user.click(screen.getByRole('button', { name: 'Metropolitan Melbourne' }));
    await user.click(screen.getByRole('button', { name: /on-site visit/i }));
    await user.click(screen.getByRole('button', { name: 'Aged care or retirement living' }));

    await user.type(screen.getByLabelText('Site address'), '30 Ramset Drive, Chirnside Park');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.type(screen.getByLabelText('Preferred times'), 'Any weekday after 2pm.');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.type(screen.getByLabelText(/notes/i), 'Sign in at reception.');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.type(screen.getByLabelText('Organisation'), 'Ramset Aged Care');
    await user.type(screen.getByLabelText('Your name'), 'Sam Taylor');
    await user.type(screen.getByLabelText('Phone'), '0400 000 000');
    await user.type(screen.getByLabelText('Work email'), 'sam@example.com');
    await user.click(screen.getByRole('button', { name: /book my assessment/i }));

    return user;
  }

  it('hands over every answer the visitor gave', async () => {
    await completeBooking();

    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1));

    const data = submitSpy.mock.calls[0]?.[1] as FormData;
    expect(Object.fromEntries(data)).toMatchObject({
      formType: 'commercial',
      siteRegion: 'melbourne',
      assessmentType: 'onsite',
      propertyType: 'aged-care-and-retirement',
      siteAddress: '30 Ramset Drive, Chirnside Park',
      preferredTimes: 'Any weekday after 2pm.',
      notes: 'Sign in at reception.',
      organisation: 'Ramset Aged Care',
      name: 'Sam Taylor',
      phone: '0400 000 000',
      email: 'sam@example.com',
      company_website: '',
    });
  });

  it('submits through the same anti-spam checks as the form', async () => {
    await completeBooking();
    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1));

    const data = submitSpy.mock.calls[0]?.[1] as FormData;
    expect(Number(data.get('renderedAt'))).toBeGreaterThan(0);
  });

  it('never counts past the last question', async () => {
    await completeBooking();

    // The flow is the seven steps in lib/enquiry/chat-flow.ts.
    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).not.toHaveTextContent(/Question 8 of 7/);
    expect(screen.getByRole('dialog')).not.toHaveTextContent(/Question 7 of 7/);
  });

  it('says plainly that nothing was delivered when no transport is configured', async () => {
    await completeBooking();

    expect(await screen.findByRole('status')).toHaveTextContent(/were not sent/i);
    expect(screen.getByRole('status')).toHaveTextContent('1300 97 97 40');
  });

  it('confirms delivery only when the server confirms it', async () => {
    submitSpy.mockResolvedValue({
      status: 'success',
      delivered: true,
      message: 'Thanks — your site assessment request is with us. We will confirm a time by email.',
    });

    await completeBooking();

    expect(await screen.findByRole('status')).toHaveTextContent(/assessment request is with us/i);
  });

  it('surfaces a server rejection instead of pretending it worked', async () => {
    submitSpy.mockResolvedValue({
      status: 'error',
      message: 'Too many enquiries from this connection.',
    });

    await completeBooking();

    expect(await screen.findByRole('status')).toHaveTextContent(/too many enquiries/i);
  });
});
