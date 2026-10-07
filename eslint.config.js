import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "server/**"],
  },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      "no-debugger": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["src/components/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/api/**",
                "**/store/**",
                "**/features/**",
                "**/pages/**",
              ],
              message:
                "Shared components must stay presentation-only and cannot depend on application layers.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/api/**"],
              message: "Features must access backend APIs through stores.",
            },
            {
              group: [
                "../city/**",
                "../events/**",
                "../friends/**",
                "../legal/**",
                "../map/**",
                "../profile/**",
                "../tourist/**",
                "@/features/city/**",
                "@/features/events/**",
                "@/features/friends/**",
                "@/features/legal/**",
                "@/features/map/**",
                "@/features/profile/**",
                "@/features/tourist/**",
              ],
              message:
                "Features must not depend on other features; compose them at the page or app layer.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/lib/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            "react",
            "react-dom",
            "react-router-dom",
            "mobx",
            "mobx-react",
            "mobx-react-lite",
          ],
          patterns: [
            {
              group: ["./**", "../**", "@/**"],
              message:
                "lib modules must be framework-independent and cannot import application code.",
            },
          ],
        },
      ],
    },
  },
];
