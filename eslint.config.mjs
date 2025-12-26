import powerbiVisualsConfigs from "eslint-plugin-powerbi-visuals";
import tseslint from 'typescript-eslint';

export default [
    ...tseslint.configs.recommended,
    powerbiVisualsConfigs.configs.recommended,
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-unsafe-function-type": "warn",
            "prefer-const": "warn",
            "@typescript-eslint/no-unused-expressions": "warn"
        }
    },
    {
        ignores: ["node_modules/**", "dist/**", ".vscode/**", ".tmp/**", "coverage/**", "specs/**", "test.webpack.config.js", "karma.conf.ts"],
    },
];