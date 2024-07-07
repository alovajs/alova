module.exports = {
  env: { browser: true, es2020: true },
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  extends: [
    // add more generic rule sets here, such as:
    'eslint:recommended',
    'plugin:svelte/recommended'
  ],
  rules: {
    // override/add rules settings here, such as:
    'a11y-click-events-have-key-events': 'off',
    'a11y-no-static-element-interactions': 'off',
    'a11y-missing-attribute': 'off',
    'import/no-unresolved': 'off'
  }
};
