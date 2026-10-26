'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

export function Reveal({
  children,
  delayMs = 0,
  as: Tag = 'div',
  className = '',
}: {
  children: ReactNode;

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

          observer.disconnect();
        }
      },

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
