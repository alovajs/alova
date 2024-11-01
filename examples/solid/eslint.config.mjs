import js from '@eslint/js';
import solid from 'eslint-plugin-solid/configs/recommended';
import globals from 'globals';

export default [
  js.configs.recommended, // Replaces eslint:recommended
  solid,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  }
];
