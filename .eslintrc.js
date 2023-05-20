module.exports = {
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    root: true,
    rules: {
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "no-case-declarations": "off",
        "no-control-regex": "off",
        "no-empty": ["error", { "allowEmptyCatch": true }],
        "no-fallthrough": "off",
        "no-misleading-character-class": "warn",
    }
};
