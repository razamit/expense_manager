import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "src/generated/**",
      "prisma/migrations/**",
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    // The React Compiler rule set bundled with eslint-config-next 16 is
    // advisory here: this app is not built for the compiler and intentionally
    // uses fetch-on-mount effects and manual useCallback memoization. Surface
    // these as warnings rather than failing the build.
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  {
    // CommonJS tooling scripts and config files legitimately use require().
    files: ["**/*.cjs", "**/*.config.{js,cjs,mjs}", "scripts/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
