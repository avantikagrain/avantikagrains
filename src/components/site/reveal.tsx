'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Reveals its children once, the first time they scroll into view.
 *
 * The site's CSS-only `.reveal` (scroll-driven `animation-timeline: view()`)
 * is cheaper and is still the right tool for a single element. This exists
 * for the one thing that timeline cannot do: a stagger measured in
 * milliseconds. A scroll-driven animation is tied to scroll position, so
 * "80ms after the card before it" has no meaning there — the only stagger
 * available is by scroll offset, which collapses the moment someone flicks
 * past the whole group at once.
 *
 * It also reveals once and then stops observing, so cards do not re-animate
 * every time they are scrolled back past.
 *
 * Accessibility and robustness:
 *   - `prefers-reduced-motion` is handled in CSS, not here, so there is no
 *     state to set before the first paint.
 *   - the hidden state is applied by a stylesheet rule that a `<noscript>`
 *     block in the layout cancels, so a visitor without JavaScript sees the
 *     content rather than an empty page.
 */
export function Reveal({
  children,
  delayMs = 0,
  as: Tag = 'div',
  className = '',
}: {
  children: ReactNode;
  /** Stagger within a group. Keep it small — 60–120ms reads as one motion. */
  delayMs?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setShown(true);
          // Once is once: stop watching so scrolling back up does not
          // replay the animation.
          observer.disconnect();
        }
      },
      // Fire a little before the element's top edge reaches the bottom of
      // the viewport, so the motion finishes as it arrives rather than
      // starting after it is already sitting there.
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={shown ? 'shown' : 'pending'}
      style={delayMs ? ({ '--reveal-delay': `${delayMs}ms` } as React.CSSProperties) : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}