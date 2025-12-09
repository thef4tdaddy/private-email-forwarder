import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import architectureRules from './eslint-rules/architecture.js';
import strictTypingRules from './eslint-rules/strict-typing.js';
import exclusions from './config-modules/exclusions.js';

export default tseslint.config(
  { ignores: ['dist', '.svelte-kit'] },
  ...svelte.configs['flat/recommended'],
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx,svelte}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.svelte'],
      },
    },
    rules: {
      ...architectureRules,
      ...strictTypingRules,
      ...exclusions,
    },
  },
  // Architecture enforcement block
  {
    files: ['src/pages/**/*.{ts,tsx,svelte}', 'src/components/**/*.{ts,tsx,svelte}'],
    rules: {
      ...architectureRules,
    },
  },
  // Strict typing block
  {
    files: ['**/*.{ts,tsx,svelte}'],
    rules: {
      ...strictTypingRules,
    },
  },
);
