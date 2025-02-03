import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat();

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: ["node_modules/", ".next/", "out/", "public/"],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn", // Change 'error' to 'warn'
    },
  },
];

export default eslintConfig;
