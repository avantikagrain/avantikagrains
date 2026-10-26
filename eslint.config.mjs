import next from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

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
    files: ['scripts/**/*.mjs', 'src/scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
];

export default config;
