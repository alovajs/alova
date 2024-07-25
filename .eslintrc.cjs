module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  root: true,
  ignorePatterns: ['coverage', 'examples', '**/dist', 'packages/alova/typings/serverhook.d.ts'],
  extends: ['airbnb', 'airbnb-typescript', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'react/function-component-definition': [2, { namedComponents: ['arrow-function', 'function-declaration'] }],

    // eslint-airbnb
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'off',
    'no-param-reassign': 'off',
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': 'off',
    'import/no-mutable-exports': 'off',
    'no-nested-ternary': 'off',
    'no-multi-assign': 'off',
    'consistent-return': 'off',
    'no-restricted-exports': 'off',
    'linebreak-style': ['error', 'unix'],
    'no-unused-vars': 'off',
    'import/order': 'off',
    'import/no-relative-packages': 'off',
    'guard-for-in': 'off',
    'max-classes-per-file': 'off',
    'no-await-in-loop': 'off',
    'func-names': 'off',

    // jsx-a11y
    'jsx-a11y/aria-role': 'off',
    'react/button-has-type': 'off',
    'react/require-default-props': 'off',
    'react/react-in-jsx-scope': 'off',

    // @typescript-eslint
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { destructuredArrayIgnorePattern: '^_' }],
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-implied-eval': 'off',
    '@typescript-eslint/no-shadow': 'off',
    'no-empty': 'off'
  }
};
