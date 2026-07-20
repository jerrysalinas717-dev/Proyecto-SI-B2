import pluginTipos from "@typescript-eslint/eslint-plugin";
import parserTipos from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  {
    files: ["src/**/*.ts", "pruebas/**/*.ts"],
    languageOptions: {
      parser: parserTipos,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
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

