import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // `catch (e) {}` without using `e` is this codebase's normal style.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', caughtErrors: 'none' }],
      // These four come from eslint-plugin-react-hooks v7's React Compiler checks. This app
      // doesn't use the React Compiler, and they flag deliberate patterns - most notably
      // `someRef.current = latestFn` on every render, which is how deferred callbacks avoid
      // stale closures (see CLAUDE.md, house rule 3). rules-of-hooks and exhaustive-deps
      // stay on.
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // App.jsx exports one component plus module-level helpers; that's fine.
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // The stats pages load this as a plain <script> (no modules, no build step), so its
    // top-level functions are deliberately globals used from each page's inline script.
    files: ['public/stats/**/*.js'],
    languageOptions: { sourceType: 'script' },
    rules: {
      'no-unused-vars': ['error', { vars: 'local', caughtErrors: 'none' }],
    },
  },
])
