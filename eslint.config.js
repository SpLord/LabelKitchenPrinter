import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  // Konfigurationsdateien laufen in Node, nicht im Browser
  {
    files: ['*.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: js.configs.recommended.rules,
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // Wird per <script> aus public/dymo.connect.framework.js geladen
        dymo: 'readonly',
        // Von Vite zur Build-Zeit ersetzt (siehe vite.config.js → define)
        __APP_VERSION__: 'readonly',
        __APP_RELEASE__: 'readonly',
        __BUILD_TIME__: 'readonly',
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      // Das hier hätte den useMemo-Absturz gefunden, bevor er in Produktion ging:
      'no-undef': 'error',

      // Und das hier den Absturz in 1.11.0-dev: ein State wurde im selben Hook
      // benutzt, bevor er deklariert war (temporal dead zone) – Lint und Build
      // waren grün, die ErrorBoundary blendete das ganze Katzenspiel aus.
      // Nur derselbe Gültigkeitsbereich; Aufrufe aus Funktionen bleiben erlaubt.
      'no-use-before-define': ['error', { functions: false, classes: false, variables: false }],

      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'react/prop-types': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
];
