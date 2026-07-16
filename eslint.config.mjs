import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**"] },
  js.configs.recommended,
  { files: ["**/*.js"], languageOptions: { ecmaVersion: 2022, sourceType: "commonjs", globals: { ...globals.node, ...globals.mocha } }, rules: { "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }] } }
];
