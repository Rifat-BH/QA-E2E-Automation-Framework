import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/', '.auth/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Specs import from the fixtures barrel so every test gets the shared
      // arrangement. Importing the raw runner silently opts out of it.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              message:
                "Import test and expect from '@fixtures' so the spec gets the shared fixtures. " +
                'Import types directly from @playwright/test only where a type is all you need.',
            },
          ],
        },
      ],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // The rule guards specs. Everything here legitimately needs the real
    // runner: the barrel builds on it, the config defines it, and setup files
    // run before any fixture exists.
    files: ['src/**/*.ts', 'playwright.config.ts', 'tests/setup/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
