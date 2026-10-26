'use client';

import Image, { getImageProps } from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  src: string;

  mobileSrc?: string;

  alt: string;
  href: string;
}

const BANNERS: Banner[] = [
  {
    src: '/brand/hero-1.webp',

    alt: 'Wholesome nutrition for every home — premium grains, pulses and seeds for healthier, happier families. Shop now.',
    href: '/products',
  },
  {
    src: '/brand/hero-2.webp',

    alt: 'From our fields to your family — premium grains, pulses and seeds for a healthier, happier you. Shop now.',
    href: '/products',
  },
  {
    src: '/brand/hero-3.webp',

    alt: 'Good food, brighter days — premium grains, pulses and seeds for a healthier, happier you. Shop now.',
    href: '/products',
  },
];

const MOBILE_UPTO = '(max-width: 639px)';
const DESKTOP_FROM = '(min-width: 640px)';

const INTERVAL_MS = 6500;

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function HeroBanners() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const [interacting, setInteracting] = useState(false);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const hidden = useSyncExternalStore(
    (onChange) => {
      document.addEventListener('visibilitychange', onChange);
      return () => document.removeEventListener('visibilitychange', onChange);
    },
    () => document.hidden,
    () => false,
  );

  const paused = interacting || reducedMotion || hidden;

  const go = useCallback(
    (next: number) => setIndex((next + BANNERS.length) % BANNERS.length),
    [],
  );

  useEffect(() => {
    if (paused || BANNERS.length < 2) return;
    const id = window.setInterval(() => go(index + 1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [index, paused, go]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={() => setInteracting(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(delta) > 48) go(index + (delta < 0 ? 1 : -1));
        touchStartX.current = null;
      }}
    >
      <div className="mx-auto max-w-[86rem] px-3 pt-24 sm:px-6 sm:pt-28">
        <div className="relative overflow-hidden rounded-[var(--radius-panel-lg)] bg-[var(--bg-sunken)] shadow-[var(--shadow-soft)]">

          <div className="relative aspect-[1.15/1] sm:aspect-[2000/750]">
            {BANNERS.map((banner, i) => (
              <Link
                key={banner.src}
                href={banner.href}
                aria-hidden={i !== index}
                tabIndex={i === index ? 0 : -1}
                aria-label={banner.alt}
                className={`absolute inset-0 transition-opacity duration-[var(--t-slow)] ease-[var(--ease-lux)] ${
                  i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <BannerImage banner={banner} priority={i === 0} />
              </Link>
            ))}
          </div>

          {BANNERS.length > 1 && (
            <>
              <Arrow side="left" label="Previous banner" onClick={() => go(index - 1)}>
                <ChevronLeft size={18} strokeWidth={1.8} />
              </Arrow>
              <Arrow side="right" label="Next banner" onClick={() => go(index + 1)}>
                <ChevronRight size={18} strokeWidth={1.8} />
              </Arrow>

              <ul className="glass absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-1.5 sm:bottom-5">
                {BANNERS.map((banner, i) => (
                  <li key={banner.src}>
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Show banner ${i + 1} of ${BANNERS.length}`}
                      aria-current={i === index ? 'true' : undefined}
                      className={`block h-2 rounded-full transition-all duration-[var(--t-base)] ease-[var(--ease-lux)] ${
                        i === index
                          ? 'w-7 bg-[var(--accent)]'
                          : 'w-2 bg-[var(--accent)]/45 hover:bg-[var(--accent)]/70'
                      }`}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function BannerImage({ banner, priority }: { banner: Banner; priority: boolean }) {
  const shared = {
    alt: banner.alt,
    fill: true,
    quality: 82,

    priority,
  } as const;

  if (!banner.mobileSrc) {
    return (
      <Image
        {...shared}
        alt={banner.alt}
        src={banner.src}
        sizes="(max-width: 1376px) 100vw, 1376px"
        className="object-cover object-left sm:object-center"
      />
    );
  }

  const { props: desktop } = getImageProps({
    ...shared,
    src: banner.src,
    sizes: '(max-width: 1376px) 100vw, 1376px',
  });
  const { props: mobile } = getImageProps({
    ...shared,
    src: banner.mobileSrc,
    sizes: '100vw',
  });

  return (
    <picture>
      <source media={MOBILE_UPTO} srcSet={mobile.srcSet} sizes={mobile.sizes} />
      <source media={DESKTOP_FROM} srcSet={desktop.srcSet} sizes={desktop.sizes} />
      <img {...desktop} alt={banner.alt} className="absolute inset-0 h-full w-full object-cover" />
    </picture>
  );
}

function Arrow({
  side,
  label,
  onClick,
  children,
}: {
  side: 'left' | 'right';
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`glass absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-[var(--accent)] transition-colors duration-[var(--t-fast)] hover:text-[var(--accent-deep)] sm:grid ${
        side === 'left' ? 'left-4' : 'right-4'
      }`}
    >
      {children}
    </button>
  );
}
