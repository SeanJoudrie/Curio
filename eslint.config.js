import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

// Lean config: the point is to catch real bugs (Rules of Hooks — which once
// crashed the core loop) in CI, not to bikeshed style.
export default tseslint.config(
  { ignores: ["dist", "node_modules", "*.config.js", "src/data/**"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error", // the guard that matters
      "react-hooks/exhaustive-deps": "warn",
      "no-undef": "off", // TypeScript checks this; browser globals are fine
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-empty-object-type": "off",
      "no-empty": "off",
    },
  }
);
