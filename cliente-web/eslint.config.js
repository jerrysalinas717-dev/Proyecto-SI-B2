import { createRequire } from "node:module";

const requireDesdeServidor = createRequire(new URL("../servidor/package.json", import.meta.url));
const pluginTipos = requireDesdeServidor("@typescript-eslint/eslint-plugin");
const parserTipos = requireDesdeServidor("@typescript-eslint/parser");

export default [
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx", "pruebas/**/*.ts", "pruebas/**/*.tsx"],
    languageOptions: {
      parser: parserTipos,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      },
      globals: {
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        fetch: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": pluginTipos
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];
