import type { Metadata, Viewport } from 'next';
import { CartProvider } from '@/components/cart/cart-store';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { WhatsappLauncher } from '@/components/site/whatsapp-launcher';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Avantika Grain Mills — premium grains, precisely refined',
    template: '%s · Avantika Grain Mills',
  },
  description:
    'Heritage grains, pulses and seeds from Avantika Grain Mills, Depalpur, Indore. Optically graded, cold-milled, packed for everyday nutrition.',
  openGraph: { type: 'website', locale: 'en_IN', siteName: 'Avantika Grain Mills' },
  robots:
    process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'
      ? { index: true, follow: true }
      : { index: false, follow: false },
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

        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsappLauncher />
        </CartProvider>
      </body>
    </html>
  );
}
