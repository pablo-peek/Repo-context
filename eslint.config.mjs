import { defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default defineConfig(
  [
    { files: ['**/*.{js,mjs,cjs,ts}'] },
    {
      files: ['**/*.{js,mjs,cjs,ts}'],
      languageOptions: {
        globals: {
          ...globals.es2021,
          ...globals.node
        },
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 12,
          sourceType: 'module'
        }
      }
    },
    {
      files: ['**/*.{js,mjs,cjs,ts}'],
      plugins: { js, prettier: prettierPlugin },
      extends: ['js/recommended'],
      rules: {
        'no-trailing-spaces': 'error',
        'prettier/prettier': [
          'error',
          {
            printWidth: 100,
            trailingComma: 'none',
            tabWidth: 2,
            semi: true,
            singleQuote: true,
            bracketSpacing: true,
            arrowParens: 'always',
            endOfLine: 'auto',
            proseWrap: 'preserve',
            quoteProps: 'as-needed',
            useTabs: false
          }
        ],
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
      }
    },
    tseslint.configs.recommended,
    prettier
  ],
  {
    ignores: ['dist/**']
  }
);
