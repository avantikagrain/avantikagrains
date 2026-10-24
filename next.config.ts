import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * React's development build uses eval() to reconstruct stack traces across
 * environments, so the dev CSP must allow 'unsafe-eval'. Production React
 * never calls eval(), so the production policy omits it — adding it there
 * would weaken the main defence against injected script execution.
 */
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDev ? ["'unsafe-eval'"] : []),
  'https://checkout.razorpay.com',
  'https://www.googletagmanager.com',
].join(' ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    // Razorpay Checkout is loaded from their CDN and renders in an iframe;
    // both are required by their documented integration.
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      // Fonts are self-hosted, so no third-party font or stylesheet origin
      // needs to be allowed at all. Narrower policy, one less thing that
      // can be compromised upstream.
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https:",
      // Dev needs the HMR websocket; production has no such connection.
      `connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://www.google-analytics.com${
        isDev ? ' ws: wss:' : ''
      }`,
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fail the production build on type errors rather than shipping them.
  // (Next 16 removed the `eslint` config key — linting runs via `npm run lint`
  // and in CI, not as part of `next build`.)
  typescript: { ignoreBuildErrors: false },

  images: {
    formats: ['image/avif', 'image/webp'],

    /**
     * Next 16 only serves qualities listed here — the default allowlist is
     * [75], and any other value makes the optimizer return 400, so the
     * image silently never loads. Every `quality` prop used in the app must
     * appear in this list.
     */
    qualities: [75, 82],
    // Matches the breakpoints the storefront is tested at.
    deviceSizes: [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'avantikagrains.com' },
      {
        // Editorial photography for the Quality page. Scoped to the one
        // account that serves it rather than the whole of Cloudinary —
        // a bare `res.cloudinary.com` entry would let any URL anywhere
        // route through our optimiser, which is someone else's bandwidth
        // bill and our domain on the result.
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/sbfiliaz/**',
      },
      // Add the CDN host here once STORAGE_PROVIDER is configured.
    ],
  },

  experimental: {
    // Mongoose is server-only; keep it out of the client bundle graph.
    serverActions: { bodySizeLimit: '2mb' },
  },

  serverExternalPackages: ['mongoose', 'bcryptjs', 'pino', 'razorpay'],

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // Font files never change in place — a different weight is a
        // different filename — so they can be cached for a year. Without
        // this they are revalidated on every navigation, which is the one
        // thing self-hosting was meant to avoid.
        source: '/fonts/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  poweredByHeader: false,
  compress: true,
};

export default nextConfig;