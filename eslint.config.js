import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default defineConfig([
  // Global ignores
  {
    ignores: [
      '**/dist/**', 
      '**/node_modules/**', 
      '**/*.d.ts',
      '**/coverage/**',
      '**/*.min.js'
    ]
  },
  
  // JavaScript files
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'prefer-const': 'error',
      'semi': ['error', 'always']
    }
  },
  
  // TypeScript files - use proper typescript-eslint configuration
  ...tseslint.config(
    {
      files: ['**/*.ts', '**/*.tsx'],
      extends: [
        ...tseslint.configs.recommended
      ],
      languageOptions: {
        globals: {
          ...globals.node
        }
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn'
      }
    }
  ),
  
  // Override test files to be more lenient
  ...tseslint.config(
    {
      files: ['**/*.test.ts', '**/*.spec.ts', '**/vitest.config.ts'],
      extends: [
        ...tseslint.configs.recommended
      ],
      languageOptions: {
        globals: {
          ...globals.node
        }
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off'
      }
    }
  )
]);
