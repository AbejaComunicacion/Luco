import tseslint from "typescript-eslint";

const eslintConfig = tseslint.config(
  ...tseslint.configs.recommended,
  {
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts"],
  },
);

export default eslintConfig;
