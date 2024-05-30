module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/recommended', 'eslint:recommended', '@vue/prettier'],
  rules: {
    'vue/multi-word-component-names': 'off',
    'no-console': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: true,
        tabWidth: 2,
        printWidth: 100,
        trailingComma: 'all',
      },
    ],
    'vue/component-name-in-template-casing': ['error', 'kebab-case'],
  },
  ignorePatterns: ['*.timestamp-*.mjs'],
  overrides: [
    {
      files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
      env: {
        jest: true,
      },
    },
  ],
};
