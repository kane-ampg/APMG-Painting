import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Layout primitives                                                    */
/* ------------------------------------------------------------------ */

export function Container({
  children,
  className,
  width = 'default',
}: {
  children: ReactNode;
  className?: string;
  width?: 'default' | 'narrow' | 'wide';
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-8',
        width === 'narrow' && 'max-w-3xl',
        width === 'default' && 'max-w-6xl',
        width === 'wide' && 'max-w-7xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  children,
  className,
  tone = 'paper',
  reveal = true,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  tone?: 'paper' | 'sunken' | 'ink' | 'brand';
  /**
   * Opts the section into the scroll reveal in components/motion. On by
   * default because every section below the fold should get it; set false for
   * anything that can sit in the first viewport, where there is nothing to
   * scroll to and the movement would just be noise.
   */
  reveal?: boolean;
} & Omit<ComponentProps<'section'>, 'className'>) {
  return (
    <section
      data-reveal={reveal ? '' : undefined}
      className={cn(
        'py-14 sm:py-20',
        tone === 'paper' && 'bg-white text-ink',
        tone === 'sunken' && 'bg-paper-sunken text-ink',
        tone === 'ink' && 'bg-ink text-white',
        // The signature APMG slab: black ground, red rule across the top.
        tone === 'brand' && 'border-t-4 border-brand-600 bg-ink text-white',
        // Anything with an id is an anchor target, and the header is sticky —
        // without this the heading lands underneath it.
        rest.id && 'scroll-mt-16 sm:scroll-mt-20',
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Typography                                                           */
/* ------------------------------------------------------------------ */

/**
 * The one uppercase micro-label treatment.
 *
 * Eyebrows, stage numbers, card meta, footer column headings and the figures
 * band all compose this and add only a colour. Before it there were two
 * letterspacings — `tracking-[0.14em]` and Tailwind's `wide` — doing the same
 * job in different places.
 */
export const microLabel = 'text-xs font-semibold uppercase tracking-label';

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn(microLabel, 'mb-3 text-brand-600', className)}>{children}</p>;
}

export function SectionHeading({
  children,
  as: Tag = 'h2',
  className,
}: {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  return (
    <Tag
      className={cn(
        'text-balance font-display text-3xl leading-tight tracking-tight sm:text-4xl',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Lede({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('max-w-prose text-lg text-ink-soft', className)}>{children}</p>;
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('max-w-prose space-y-4 text-ink-soft [&_strong]:text-ink', className)}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Button / CTA                                                         */
/* ------------------------------------------------------------------ */

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-60';

const buttonVariants = {
  primary: 'bg-brand-700 text-white hover:bg-brand-600',
  // Red on a black ground: 600 reads brighter against ink than 700 does.
  accent: 'bg-brand-600 text-white hover:bg-brand-500 focus-visible:ring-offset-ink',
  outline: 'border border-paper-edge bg-white text-ink hover:bg-paper-sunken',
  ghostLight: 'border border-white/30 text-white hover:bg-white/10',
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className,
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
} & Omit<ComponentProps<typeof Link>, 'href' | 'className'>) {
  const isInternal = href.startsWith('/');

  if (!isInternal) {
    return (
      <a href={href} className={cn(buttonBase, buttonVariants[variant], className)}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cn(buttonBase, buttonVariants[variant], className)} {...rest}>
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...rest
}: { variant?: ButtonVariant } & ComponentProps<'button'>) {
  return (
    <button className={cn(buttonBase, buttonVariants[variant], className)} {...rest}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                                */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'article';
}) {
  return (
    <Tag
      className={cn(
        'relative flex h-full flex-col rounded-lg border border-paper-edge bg-white p-6',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Editorial placeholder.
 *
 * Renders visibly, in the page, wherever content is genuinely missing — so a
 * gap can never be mistaken for a fact. Hidden from assistive tech announcement
 * order only in the sense that it reads as the aside it is.
 */
export function Placeholder({ note }: { note: string }) {
  return (
    <p className="rounded-md border border-dashed border-signal-400 bg-signal-400/5 px-4 py-3 text-sm text-ink-soft">
      <span className={cn(microLabel, 'text-signal-600')}>Awaiting content — </span>
      {note}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Media hover                                                          */
/* ------------------------------------------------------------------ */

/**
 * The house hover for photography: one slow, quiet zoom.
 *
 * Apply to the <Image> itself. The frame around it must carry `group` and
 * `overflow-hidden` so the growth is clipped by the frame rather than spilling
 * over its neighbours. Held to 1.04 over 700ms — trade photos should settle,
 * not lurch — and it keys off focus-within too, so a keyboard user tabbing to a
 * card's link sees the same movement a mouse user does.
 */
export const mediaZoom =
  'transition-transform duration-700 ease-out ' +
  'group-hover:scale-[1.04] group-focus-within:scale-[1.04] ' +
  'motion-reduce:transform-none motion-reduce:transition-none';
