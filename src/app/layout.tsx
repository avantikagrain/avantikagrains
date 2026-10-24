import type { Metadata, Viewport } from 'next';
import { CartProvider } from '@/components/cart/cart-store';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import './globals.css';

/**
 * Typefaces are self-hosted from `public/fonts` (see globals.css).
 *
 * They were previously a fonts.googleapis.com stylesheet link, which cost
 * two extra DNS + TLS handshakes before a single glyph could be requested,
 * and left the brand typography at the mercy of a third party: Google Fonts
 * is blocked outright on some corporate networks and in some countries, and
 * the fallback there is Georgia, which is not this brand.
 *
 * `next/font/google` is not the answer either — it downloads the files
 * during `next build`, so a deploy fails whenever that host is unreachable
 * from the build machine.
 *
 * Six static .woff2 files, 148 KB in total, come from the @fontsource
 * packages at install time, are served from our own origin with immutable
 * caching, and need no network at build or at runtime.
 */

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Avantika Grain Mills — premium grains, precisely refined',
    template: '%s · Avantika Grain Mills',
  },
  description:
    'Heritage grains, pulses and seeds from Avantika Grain Mills, Depalpur, Indore. Optically graded, cold-milled, packed for everyday nutrition.',
  openGraph: { type: 'website', locale: 'en_IN', siteName: 'Avantika Grain Mills' },
  // Flipped to index once the launch checklist passes.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#faf6ec',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        {/*
          The two faces that render above the fold on every page: the body
          text and the display headline. Preloading them removes the flash
          of fallback text that `font-display: swap` otherwise causes. The
          remaining weights are not preloaded — they appear further down the
          page, and preloading everything would compete with the hero image
          for the first bytes.
        */}
        <link
          rel="preload"
          href="/fonts/inter-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/playfair-display-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/*
          The <Reveal> component hides its children until an
          IntersectionObserver fires. Without JavaScript that observer never
          runs, so this cancels the hidden state and the content is simply
          there — a reveal animation is decoration, and decoration must
          never be what stands between a visitor and the page.
        */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}