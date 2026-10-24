import next from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/**
 * ESLint 9 flat config.
 *
 * Next 16 removed `next lint`, so linting runs through the ESLint CLI
 * (`npm run lint`). eslint-config-next 16 ships flat-config entry points,
 * which is why this file imports them directly rather than going through
 * FlatCompat.
 *
 * `core-web-vitals` is the stricter of the two Next presets: it turns the
 * performance rules — unoptimised <img>, synchronous scripts, missing
 * `priority` on an LCP image — from warnings into errors. On a storefront
 * those are revenue bugs, not style preferences.
 */
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'coverage/**',
      'next-env.d.ts',
    ],
  },

  ...next,
  ...typescript,

  {
    rules: {
      // An unused variable is almost always a leftover from an edit. The
      // underscore prefix is the escape hatch for the genuinely-unused
      // ones, such as a required-but-ignored callback parameter.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    // Scripts are operator tools run from a terminal: console output is
    // their interface, not a debugging leftover.
    files: ['scripts/**/*.mjs', 'src/scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
];

export default config;
