import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

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
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src ${scriptSrc}`,

      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https:",

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

  typescript: { ignoreBuildErrors: false },

  images: {
    formats: ['image/avif', 'image/webp'],

    qualities: [75, 82],

    deviceSizes: [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'avantikagrains.com' },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/sbfiliaz/**',
      },
      // Add the CDN host here once STORAGE_PROVIDER is configured.
    ],
  },

  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },

  serverExternalPackages: ['mongoose', 'bcryptjs', 'pino', 'razorpay'],

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
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
