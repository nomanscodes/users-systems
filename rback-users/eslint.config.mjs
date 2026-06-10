// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Files and directories to never lint
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**', 'coverage/**'],
  },

  // ── Base rule sets ──────────────────────────────────────────────────
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,

  // ── Language / parser options ────────────────────────────────────────
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ── Project-wide rule overrides ──────────────────────────────────────
  {
    rules: {
      // ── Prettier ──
      // Always error on formatting issues; endOfLine 'auto' works on both
      // Windows and Linux without CRLF noise in git diffs.
      'prettier/prettier': ['error', { endOfLine: 'auto' }],

      // ── TypeScript ──
      // `any` is sometimes necessary in NestJS decorator / filter patterns
      '@typescript-eslint/no-explicit-any': 'off',

      // Non-null assertion (!) is intentional when a guard already guarantees
      // the value is present at runtime (e.g. TenantScopeGuard + tenantId!).
      // Warn only so developers are still nudged toward better types over time.
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Type assertions on values the TS compiler can already narrow are noise.
      // Downgrade to warn so CI doesn't break; clean them up incrementally.
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

      // Floating promises are bugs in NestJS interceptors/guards — keep as warn.
      '@typescript-eslint/no-floating-promises': 'warn',

      // Unsafe argument patterns appear often with `unknown` error typing.
      '@typescript-eslint/no-unsafe-argument': 'warn',

      // Allow `void` return type to be inferred (common in NestJS void handlers)
      '@typescript-eslint/no-invalid-void-type': 'off',

      // Allow empty object types — used in NestJS generic patterns
      '@typescript-eslint/no-empty-object-type': 'off',

      // ── General JS ──
      // Warn on unused variables but allow leading-underscore convention (_unused)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Console is fine in NestJS bootstrap; Logger handles the rest
      'no-console': 'off',
    },
  },
);
