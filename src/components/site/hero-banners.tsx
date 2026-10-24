'use client';

import Image, { getImageProps } from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Homepage hero.
 *
 * These are finished marketing banners — the headline, logo and call to
 * action are part of the artwork. Overlaying the site's own headline on
 * top would duplicate what is already drawn, so the banner carries the
 * hero and the whole thing is a link.
 *
 * Because the message lives inside an image, each banner needs real alt
 * text, and the page still needs a text heading for search engines — that
 * sits immediately below, in the section this component is used from.
 */

interface Banner {
  src: string;
  /**
   * A portrait re-cut of the same banner, for phones.
   *
   * The desktop artwork is 2.67:1 with its headline and badges drawn into
   * the left half. At 390px that half is about 150px wide, so the type is
   * unreadable and the badge row ends up sliced through the middle. Until a
   * portrait version exists the component crops to the photography instead
   * and lets the HTML heading below carry the message.
   *
   * To switch a banner over: drop a 1080×1350 file at
   * public/brand/hero-N-mobile.webp and set this field. Nothing else
   * changes — the browser picks the right one per screen and never
   * downloads both.
   */
  mobileSrc?: string;
  /** Describes what the banner says, not what it looks like. */
  alt: string;
  href: string;
}

const BANNERS: Banner[] = [
  {
    src: '/brand/hero-1.webp',
    // mobileSrc: '/brand/hero-1-mobile.webp',
    alt: 'Wholesome nutrition for every home — premium grains, pulses and seeds for healthier, happier families. Shop now.',
    href: '/products',
  },
  {
    src: '/brand/hero-2.webp',
    // mobileSrc: '/brand/hero-2-mobile.webp',
    alt: 'From our fields to your family — premium grains, pulses and seeds for a healthier, happier you. Shop now.',
    href: '/products',
  },
  {
    src: '/brand/hero-3.webp',
    // mobileSrc: '/brand/hero-3-mobile.webp',
    alt: 'Good food, brighter days — premium grains, pulses and seeds for a healthier, happier you. Shop now.',
    href: '/products',
  },
];

/**
 * The breakpoint at which the layout switches to the desktop artwork.
 * The two queries must not overlap or a browser may pick either source.
 */
const MOBILE_UPTO = '(max-width: 639px)';
const DESKTOP_FROM = '(min-width: 640px)';

const INTERVAL_MS = 6500;

/**
 * Subscribes to a media query and re-renders when it changes.
 *
 * `useSyncExternalStore` rather than state-plus-effect because a media
 * query is exactly the external store it exists for: no setState in an
 * effect, no first paint with the wrong answer, and `getServerSnapshot`
 * keeps server rendering honest by assuming no preference, which is also
 * what the server cannot know.
 */
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

  /**
   * Three independent reasons to stop advancing, kept as three signals.
   *
   * They were previously collapsed into one `paused` state that every
   * source wrote to, so they overwrote each other: hovering the banner
   * paused it, but a tab switch and back then set paused = document.hidden
   * = false and it resumed under the pointer. Deriving the answer means
   * each source can only ever speak for itself.
   */
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
          {/*
            Two ratios.

            The banners are desktop artwork at 2.67:1. Shown whole at
            390px they are about 146px tall and the headline drawn into
            them is unreadable.

            The artwork puts the logo, headline, badges and Shop Now button
            in its left portion, and all of it fits inside a 1.15:1 window.
            So phones get that window — `object-left` anchors the crop to
            the type rather than centring it — and the message stays legible
            without needing a second set of files. Measured against all
            three banners, not assumed.

            Purpose-made portrait crops would still be better, because they
            could re-set the type rather than reuse it. Drop a 1080x1350
            file at public/brand/hero-N-mobile.webp and set `mobileSrc` on
            that banner; BannerImage then serves it as a real <picture>
            source and phones never download the landscape one.
          */}
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

              {/*
                The dots sit on photography whose brightness changes from
                banner to banner, so they carry their own frosted ground
                rather than relying on contrast with whatever is behind
                them. Each hit area is 24px tall even though the dot is 8px,
                because a 8px tap target is not usable on a phone.
              */}
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

/**
 * One banner, art-directed.
 *
 * With no `mobileSrc` this is an ordinary optimised image, cropped to the
 * photography on phones because the desktop artwork's headline is too small
 * to read there.
 *
 * With a `mobileSrc` it becomes a real <picture>: the browser picks the
 * portrait cut below 640px and the landscape one above, and downloads only
 * the one it picks. Two <Image> elements toggled with `hidden sm:block`
 * would be simpler to write and wrong — a display:none image is still
 * fetched, so every phone would pay for the desktop banner as well.
 *
 * `getImageProps` is how Next exposes the optimiser's srcset without
 * rendering the <img> itself, which is exactly what art direction needs.
 */
function BannerImage({ banner, priority }: { banner: Banner; priority: boolean }) {
  const shared = {
    alt: banner.alt,
    fill: true,
    quality: 82,
    // Only the first banner is the LCP candidate; the others must not
    // compete with it for bandwidth.
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
