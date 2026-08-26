'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type AnimationEvent,
  type FormEvent,
} from 'react';
import { submitEnquiry } from '@/app/actions/enquiry';
import { FormStatus } from '@/components/forms/form-status';
import { QUOTE_HASH, QUOTE_PATH } from '@/components/navigation/quote-cta';
import {
  buildEnquiryFormData,
  flows,
  validateField,
  type ChatField,
  type ChatStep,
} from '@/lib/enquiry/chat-flow';
import { QUICK_ANSWERS } from '@/lib/enquiry/chat-faqs';
import { initialEnquiryState } from '@/lib/enquiry/state';
import { microLabel } from '@/components/ui';
import { isSandbox, site } from '@/lib/site';
import { cn } from '@/lib/utils';

/**
 * The floating quote assistant.
 *
 * A second route into the enquiry pipeline for visitors who will not start a
 * seven-field form but will answer seven questions one at a time. It asks
 * exactly what the forms ask, validates with the same Zod rules, and posts to
 * the same Server Action — so it inherits the honeypot, the minimum-completion
 * check, the rate limit, and the refusal to claim a delivery that did not
 * happen.
 *
 * It is not a chatbot and answers nothing. Generating prose about warranties or
 * accreditations would contradict the whole premise of this rebuild, where an
 * unverified claim is not rendered at all.
 *
 * The conversation lives in `lib/enquiry/chat-flow.ts` as data, checked against
 * the schema in a unit test. This file is only the surface.
 */

/** Below the sticky header (z-40) and the mobile menu (z-50), never over them. */
const LAYER = 'z-30';

type Turn = { role: 'bot' | 'user'; text: string };

export function QuoteChat() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  /**
   * Dismissed, but still on screen playing its exit.
   *
   * The panel outlives its own close by one animation. For everything except
   * the pixels it is already gone: `aria-hidden` and `inert` take it out of the
   * accessibility tree and out of reach of the pointer the moment the visitor
   * closes it, focus is already back on the launcher, and the launcher has
   * already returned to its "Get a quote" state. What is left is a rectangle
   * sliding away, which is the only part worth animating.
   */
  const [closing, setClosing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  /** Question-and-answer turns the visitor asked for, before the quote starts. */
  const [asked, setAsked] = useState<Turn[]>([]);
  /** The list folds away after the first answer to make room for it. */
  const [questionsOpen, setQuestionsOpen] = useState(true);
  const [state, dispatch, pending] = useActionState(submitEnquiry, initialEnquiryState);

  const panelId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  /**
   * When the panel opened, for the server's minimum-completion-time check.
   * A ref, not state: React never needs to render it.
   */
  const openedAt = useRef(0);

  /** One flow now — the chat opens straight on its first question. */
  const formType = 'commercial';
  const steps: readonly ChatStep[] = flows[formType].steps;
  const step: ChatStep | undefined = steps[stepIndex];
  const submitted = stepIndex >= steps.length;

  /* --- focus ----------------------------------------------------------- */

  // Each new turn takes focus, so a keyboard or screen-reader user lands on the
  // thing they are being asked rather than hunting for it.
  useEffect(() => {
    if (!open) return;
    const target =
      panelRef.current?.querySelector<HTMLElement>('[data-chat-focus]') ?? panelRef.current;
    // preventScroll: the transcript scrolls itself just below, and the
    // browser's own scroll-into-view would yank against it mid-animation.
    target?.focus({ preventScroll: true });
  }, [open, formType, stepIndex]);

  // A rejected answer pulls focus back to the field that caused it.
  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    panelRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus({
      preventScroll: true,
    });
  }, [errors]);

  /**
   * Keep the newest turn in view.
   *
   * Scrolling to the bottom is right for a short exchange and wrong for a long
   * published answer — it lands the visitor on the last line of a paragraph
   * they have not read. A turn taller than half the viewport is aligned to its
   * top instead.
   */
  useEffect(() => {
    const node = transcriptRef.current;
    const latest = node?.lastElementChild;
    if (!node) return;

    if (latest instanceof HTMLElement && latest.clientHeight > node.clientHeight / 2) {
      // offsetTop, not getBoundingClientRect: the arriving turn is mid-transform
      // and its rect would be off by the animation's remaining travel.
      node.scrollTop = Math.max(0, latest.offsetTop - node.offsetTop - 8);
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [formType, stepIndex, submitted, asked]);

  useEffect(() => {
    if (!open || closing) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setClosing(true);
      launcherRef.current?.focus();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closing]);

  /**
   * Hidden where it would compete with the real thing: the contact page shows
   * both full forms already.
   */
  if (pathname === QUOTE_PATH || pathname === '/contact-us') return null;

  /* --- transitions ----------------------------------------------------- */

  function close() {
    setClosing(true);
    launcherRef.current?.focus();
  }

  /**
   * The end of the exit, and the only place the panel is actually unmounted.
   *
   * `event.target !== event.currentTarget` guards against the transcript: every
   * arriving turn and every set of controls runs its own animation, and those
   * bubble up to here. Only the panel's own animation ends the panel.
   *
   * With motion disabled globals.css cuts every duration to 0.01ms, so this
   * still fires — on the next frame rather than after 200ms. Nothing waits on
   * an animation that will not happen.
   */
  function onPanelAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || !closing) return;
    setOpen(false);
    setClosing(false);
  }

  function advanceWith(patch: Record<string, string>) {
    const next = { ...answers, ...patch };
    setAnswers(next);
    setErrors({});

    if (stepIndex + 1 >= steps.length) {
      submit(next);
      return;
    }
    setStepIndex(stepIndex + 1);
  }

  function submit(finalAnswers: Record<string, string>) {
    setStepIndex(steps.length);
    dispatch(
      buildEnquiryFormData({
        formType,
        answers: finalAnswers,
        renderedAt: openedAt.current,
        // Passed through as found, so the server rejects a bot rather than
        // this component quietly tidying up after one.
        honeypot: honeypotRef.current?.value ?? '',
      }),
    );
  }

  function choose(field: ChatField, value: string) {
    advanceWith({ [field.name]: value });
  }

  function ask(question: string, answer: string) {
    setAsked((previous) => [
      ...previous,
      { role: 'user', text: question },
      { role: 'bot', text: answer },
    ]);
    setQuestionsOpen(false);
  }

  function goBack() {
    setErrors({});

    if (submitted) {
      setStepIndex(steps.length - 1);
      return;
    }
    // The first step has nothing before it — the Back control is hidden there.
    setStepIndex(Math.max(0, stepIndex - 1));
  }

  function onStepSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!step || !formType) return;

    const data = new FormData(event.currentTarget);
    const patch: Record<string, string> = {};
    const found: Record<string, string> = {};

    for (const field of step.fields) {
      const value = String(data.get(field.name) ?? '');
      patch[field.name] = value;

      // The same rule the server will apply, so the two can never disagree.
      const message = validateField(formType, field.name, value);
      if (message) found[field.name] = message;
    }

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    advanceWith(patch);
  }

  /* --- transcript ------------------------------------------------------ */

  const turns: Turn[] = [...asked];

  for (const done of steps.slice(0, stepIndex)) {
    turns.push({ role: 'bot', text: done.prompt });
    turns.push({ role: 'user', text: summarise(done, answers) });
  }

  if (step) turns.push({ role: 'bot', text: step.prompt });

  const isChoiceStep = step?.fields.every((f) => f.kind === 'choice' || f.kind === 'confirm');

  /**
   * Progress through the quote. Answered FAQs are not questions APMG asked, so
   * they do not count. Clamped, because once submitted `stepIndex` sits one
   * past the last step.
   */
  const questionCount = steps.length;
  const questionNumber = Math.min(stepIndex + 1, questionCount);

  /**
   * Identity of the current turn. Used as a React key on the controls, so a tap
   * remounts them and replays their entry animation rather than swapping the
   * buttons under the pointer with no transition at all.
   */
  const turnKey = submitted ? 'submitted' : `${formType}:${step?.id}`;

  const subtitle = submitted ? 'Your answers' : `Question ${questionNumber} of ${questionCount}`;

  /**
   * Whether the panel is present *and* still the visitor's business. A closing
   * panel is on its way out, so the launcher goes back to being a launcher
   * while it goes.
   */
  const showing = open && !closing;

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        aria-expanded={showing}
        aria-controls={panelId}
        onClick={() => {
          if (showing) {
            close();
            return;
          }
          // Event handler, so Date.now() here is not an impure render.
          openedAt.current = Date.now();
          // A tap during the exit is a change of mind: the same panel turns
          // round rather than finishing its dismissal first.
          setClosing(false);
          setOpen(true);
        }}
        className={cn(
          'fixed bottom-5 right-5 flex items-center gap-2 rounded-full bg-brand-600 text-sm font-semibold text-white shadow-lg shadow-ink/25 hover:bg-brand-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
          // Matched to the panel's own entrance, so the button and the thing it
          // opens are visibly one movement rather than two.
          'transition-all duration-200 ease-out',
          showing ? 'h-12 w-12 justify-center' : 'py-3 pl-4 pr-5',
          'active:scale-95',
          LAYER,
        )}
      >
        {showing ? (
          <>
            <CloseIcon />
            <span className="sr-only">Close quote chat</span>
          </>
        ) : (
          <>
            <ChatIcon />
            Get a quote
          </>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Get a quote"
          tabIndex={-1}
          aria-hidden={closing || undefined}
          inert={closing}
          onAnimationEnd={onPanelAnimationEnd}
          className={cn(
            'fixed inset-x-0 bottom-0 flex flex-col overflow-hidden border-paper-edge bg-white shadow-2xl',
            'rounded-t-chat border-x border-t',
            'sm:inset-x-auto sm:bottom-24 sm:right-5 sm:w-[26rem] sm:rounded-chat sm:border',
            /*
             * Capped, not free-growing. The transcript lengthens with every
             * turn, and an uncapped panel climbs behind the sticky header
             * (z-40 to this panel's z-30) taking its own close button with it.
             * The height is bounded instead and the transcript scrolls inside.
             */
            'max-h-[88dvh] sm:max-h-[min(40rem,calc(100dvh-11rem))]',
            // The scale anchors on the launcher the panel came out of.
            'sm:origin-bottom-right',
            closing
              ? 'animate-sheet-out sm:animate-panel-out'
              : 'animate-sheet-in sm:animate-panel-in',
            LAYER,
          )}
        >
          <header className="flex items-start justify-between gap-3 bg-ink px-4 py-3 text-white">
            <div>
              <h2 className="font-display text-base font-bold">Get a quote</h2>
              <p className="text-xs text-white/70">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={close}
              className="-mr-1 -mt-1 rounded-chat-control p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <CloseIcon />
              <span className="sr-only">Close</span>
            </button>
          </header>

          {isSandbox && (
            <p className="border-b border-signal-400/40 bg-signal-400/15 px-4 py-2 text-xs text-ink-soft">
              Preview build — enquiries are not delivered. Call {site.phone.display} to reach the
              team.
            </p>
          )}

          <div
            ref={transcriptRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
            className="flex-1 space-y-2 overflow-y-auto scroll-smooth px-4 py-4"
          >
            {turns.map((turn, index) => {
              const isBot = turn.role === 'bot';
              // The face leads a run of APMG turns, not every one of them: an
              // answered FAQ is two bubbles from the same side, and repeating
              // the photograph against each turns a conversation into a column
              // of headshots.
              const leadsRun = isBot && turns[index - 1]?.role !== 'bot';

              return (
                <div
                  key={`${index}-${turn.text}`}
                  className={cn('flex animate-turn-in items-end gap-2', !isBot && 'justify-end')}
                >
                  {isBot &&
                    (leadsRun ? (
                      <SimonAvatar className="mb-0.5 h-8 w-8 ring-1 ring-paper-edge" />
                    ) : (
                      // Keeps the following bubbles on the same indent as the
                      // one that carries the face.
                      <span aria-hidden className="mb-0.5 h-8 w-8 shrink-0" />
                    ))}
                  <p
                    className={cn(
                      // w-fit so a bubble hugs its text; a block <p> would
                      // otherwise stretch to the full 85% whatever it says.
                      'w-fit max-w-[85%] rounded-chat-bubble px-3 py-2 text-sm',
                      isBot ? 'bg-paper-sunken text-ink' : 'bg-brand-600 text-white',
                    )}
                  >
                    {turn.text}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-paper-edge bg-white px-4 py-3">
            <div key={turnKey} className="animate-controls-in">
              {submitted ? (
                <div className="flex flex-col gap-3">
                  {pending ? (
                    <p className="text-sm text-ink-muted" role="status">
                      Sending…
                    </p>
                  ) : (
                    <FormStatus
                      status={state.status}
                      message={state.message}
                      delivered={state.delivered}
                    />
                  )}
                  {state.status === 'error' && !pending && (
                    <BackButton onClick={goBack}>Back to my answers</BackButton>
                  )}
                </div>
              ) : step && isChoiceStep ? (
                <div className="flex flex-col gap-2">
                  {step.fields.map((field) => (
                    <ChoiceButtons
                      key={field.name}
                      field={field}
                      onChoose={(value) => choose(field, value)}
                    />
                  ))}
                  {stepIndex === 0 ? (
                    <QuickQuestions
                      onAsk={ask}
                      expanded={questionsOpen}
                      onExpand={() => setQuestionsOpen(true)}
                    />
                  ) : (
                    <BackButton onClick={goBack}>Back</BackButton>
                  )}
                </div>
              ) : step ? (
                <div className="flex flex-col gap-2">
                  <form
                    key={step.id}
                    onSubmit={onStepSubmit}
                    className="flex flex-col gap-3"
                    noValidate
                  >
                    {step.fields.map((field, index) => (
                      <ChatTextField
                        key={field.name}
                        field={field}
                        error={errors[field.name]}
                        defaultValue={answers[field.name] ?? ''}
                        autoFocus={index === 0}
                      />
                    ))}

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="rounded-chat-control bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 active:scale-95"
                      >
                        {stepIndex + 1 >= steps.length ? 'Send enquiry' : 'Next'}
                      </button>

                      {step.fields.every((field) => field.optional) && (
                        <button
                          type="button"
                          onClick={() =>
                            advanceWith(Object.fromEntries(step.fields.map((f) => [f.name, ''])))
                          }
                          className="rounded-chat-control px-3 py-2 text-sm font-semibold text-ink-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                        >
                          Skip
                        </button>
                      )}

                      {stepIndex > 0 && (
                        <BackButton onClick={goBack} className="ml-auto">
                          Back
                        </BackButton>
                      )}
                    </div>
                  </form>
                  {stepIndex === 0 && (
                    <QuickQuestions
                      onAsk={ask}
                      expanded={questionsOpen}
                      onExpand={() => setQuestionsOpen(true)}
                    />
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-paper-edge bg-paper-sunken px-4 py-2.5 text-xs text-ink-muted">
            <span>Prefer not to chat?</span>
            <a
              href={site.phone.href}
              className="font-semibold text-brand-700 underline decoration-brand-600/40 underline-offset-2 hover:decoration-brand-600"
            >
              {site.phone.display}
            </a>
            <Link
              href={`${QUOTE_PATH}${QUOTE_HASH}`}
              onClick={close}
              className="font-semibold text-ink-soft underline decoration-ink-muted/40 underline-offset-2 hover:decoration-ink-soft"
            >
              Full enquiry form
            </Link>
          </footer>

          {/*
            Honeypot. Hidden from sighted users and from assistive tech, so only
            a bot fills it. Its own id, because the real form's honeypot uses
            `company_website` and two elements must not share one.
          */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
            <label htmlFor="quote-chat-company-website">
              Company website — leave this field empty
            </label>
            <input
              ref={honeypotRef}
              id="quote-chat-company-website"
              name="company_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                               */
/* ------------------------------------------------------------------ */

/**
 * Simon Taranek, who receives these enquiries, against the APMG side of the
 * transcript.
 *
 * Decorative, and deliberately unlabelled: `alt=""` and `aria-hidden`, with the
 * panel's own "Get a quote" heading left as the only thing that identifies what
 * the visitor is talking to. A named face beside a question would read as a
 * person typing back, and nothing here is typing — the questions are the ones
 * on the enquiry form and the answers are quoted from the site's FAQs. The
 * photograph is warmth, not a claim, which is also why it stays inside the
 * conversation rather than going on the launcher.
 *
 * 256px for a 32px slot: this is a face, and faces are where a soft resample
 * shows. It costs 8KB, downloaded only when the panel is opened.
 */
function SimonAvatar({ className }: { className?: string }) {
  return (
    <Image
      src="/images/company/simon-taranek.webp"
      alt=""
      aria-hidden
      width={256}
      height={256}
      sizes="32px"
      className={cn('shrink-0 rounded-full object-cover', className)}
    />
  );
}

function ChoiceButtons({
  field,
  onChoose,
}: {
  field: ChatField;
  onChoose: (value: string) => void;
}) {
  const options =
    field.kind === 'confirm'
      ? [
          { value: 'true', label: 'Yes, please' },
          { value: '', label: 'No thanks' },
        ]
      : (field.options ?? []);

  return (
    <div role="group" aria-label={field.label} className="flex flex-col gap-2">
      {field.hint && <p className="text-xs text-ink-muted">{field.hint}</p>}
      {options.map((option, index) => (
        <button
          key={option.value || option.label}
          type="button"
          data-chat-focus={index === 0 ? '' : undefined}
          onClick={() => onChoose(option.value)}
          className="rounded-chat-control border border-paper-edge bg-white px-3 py-2.5 text-left text-sm font-semibold text-ink transition hover:border-brand-600 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 active:scale-[0.98]"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * The five things visitors ask before they are ready to start a quote.
 *
 * Offered only on the opening turn: once someone is answering questions, a list
 * of other questions is noise. Every answer is quoted from the site's published
 * FAQs — see `lib/enquiry/chat-faqs.ts`.
 */
function QuickQuestions({
  onAsk,
  expanded,
  onExpand,
}: {
  onAsk: (question: string, answer: string) => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="mt-1 animate-controls-in self-start border-t border-paper-edge pt-3 text-sm font-semibold text-ink-muted underline decoration-paper-edge underline-offset-2 transition hover:text-ink hover:decoration-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        Ask something else
      </button>
    );
  }

  return (
    <div className="mt-1 animate-controls-in border-t border-paper-edge pt-3">
      <p className={cn(microLabel, 'mb-2 text-ink-muted')}>Or ask us something</p>
      <div className="flex flex-col gap-1">
        {QUICK_ANSWERS.map((entry) => (
          <button
            key={entry.question}
            type="button"
            onClick={() => onAsk(entry.question, entry.answer)}
            className="rounded-chat-control px-2 py-1.5 text-left text-sm text-ink-soft underline decoration-paper-edge underline-offset-2 transition hover:bg-paper-sunken hover:text-ink hover:decoration-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            {entry.question}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * A labelled text control. Same contract as `components/forms/fields.tsx`: a
 * real visible label bound by id, errors in text and bound by aria-describedby,
 * never colour alone.
 */
function ChatTextField({
  field,
  error,
  defaultValue,
  autoFocus,
}: {
  field: ChatField;
  error?: string;
  defaultValue: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy =
    [field.hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  const shared = {
    id,
    name: field.name,
    defaultValue,
    autoComplete: field.autoComplete,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': describedBy,
    ...(autoFocus ? { 'data-chat-focus': '' } : {}),
    className: cn(
      'w-full rounded-chat-control border bg-white px-3 py-2 text-base text-ink',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
      error ? 'border-red-700' : 'border-paper-edge',
    ),
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {field.label}
      </label>

      {field.hint && (
        <p id={hintId} className="text-xs text-ink-muted">
          {field.hint}
        </p>
      )}

      {field.kind === 'textarea' ? (
        <textarea rows={3} {...shared} />
      ) : (
        <input type={field.inputType ?? 'text'} {...shared} />
      )}

      {error && (
        <p id={errorId} className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function BackButton({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-chat-control px-3 py-2 text-sm font-semibold text-ink-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Transcript helpers                                                   */
/* ------------------------------------------------------------------ */

function optionLabel(field: ChatField | undefined, value: string): string {
  return field?.options?.find((option) => option.value === value)?.label ?? value;
}

/** How an answered turn reads back in the transcript. */
function summarise(step: ChatStep, answers: Readonly<Record<string, string>>): string {
  return step.fields
    .map((field) => {
      const value = answers[field.name] ?? '';

      if (field.kind === 'confirm') return value === 'true' ? 'Yes, please' : 'No thanks';
      if (value === '') return field.optional ? 'Skipped' : '';
      if (field.kind === 'choice') return optionLabel(field, value);
      return value;
    })
    .filter(Boolean)
    .join(' · ');
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M4 4.75h12a1.25 1.25 0 0 1 1.25 1.25v6.5A1.25 1.25 0 0 1 16 13.75h-5.5L6.75 16.5v-2.75H4A1.25 1.25 0 0 1 2.75 12.5V6A1.25 1.25 0 0 1 4 4.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="m5.5 5.5 9 9m0-9-9 9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
