// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Build-time node scripts (icon generation), not app code.
    files: ["scripts/**/*.cjs"],
    languageOptions: {
      globals: { __dirname: "readonly", require: "readonly", module: "readonly", console: "readonly", process: "readonly" },
    },
  }
]);
