import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.browser },
    extends: [
      ...tseslint.configs.recommended,  // TypeScript ESLint rules
      "eslint:recommended",  // ESLint recommended rules
      "plugin:prettier/recommended",  // Enables Prettier formatting
      prettier // Disables ESLint rules that conflict with Prettier
    ],
    rules: {
      "prettier/prettier": ["error", { "singleQuote": true }],  // Forces single quotes
      "quotes": ["error", "single"],  // Ensures single quotes are used
      "semi": ["error", "always"],  // Ensures semicolons at end of lines
    },
  },
];
