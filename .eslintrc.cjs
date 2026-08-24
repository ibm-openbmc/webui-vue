/* eslint-env node */
require('dotenv').config();
module.exports = {
  root: true,
  env: {
    es2021: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@babel/eslint-parser',
    ecmaVersion: 2021,
    sourceType: 'module',
    requireConfigFile: false,
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/prettier',
  ],
  plugins: ['vitest'],
  rules: {
    'vue/multi-word-component-names': 'off',
    'no-console': 'off',
    'no-debugger': 'error',
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: true,
        tabWidth: 2,
        trailingComma: 'all',
      },
    ],
    'vue/component-name-in-template-casing': 'off',
    'no-unused-vars': 'off',
    'vue/script-setup-uses-vars': 'error',
    'vue/require-explicit-emits': 'off',
  },
  ignorePatterns: ['*.timestamp-*.mjs'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    {
      files: [
        'vite.config.*',
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        node: true,
      },
    },
  ],
};
