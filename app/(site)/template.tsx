import { ViewTransition } from 'react';

/**
 * Page transitions.
 *
 * A template, not the layout, because a template is re-keyed per route: the old
 * page's tree unmounts and the new one mounts, which is exactly the exit/enter
 * pair `<ViewTransition>` needs. In a layout the element persists across
 * navigations and neither animation ever fires.
 *
 * `default="none"` keeps this boundary out of every *other* transition on the
 * page — without it the whole page would animate whenever anything else did.
 *
 * The header, footer and chat panel live in the layout, outside this boundary,
 * so they are not part of the animation and hold still while the content
 * changes. That fixed frame is the point: it is the content that moved, not the
 * viewport.
 *
 * The wrapping <div> is deliberate. A view transition name attaches to one box;
 * pages return several sections, and giving each its own snapshot would animate
 * a long page in pieces.
 *
 * Browsers without the View Transitions API render exactly as before — the
 * navigation is instant, nothing is hidden waiting on an animation.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
