import nextConfig from "eslint-config-next";

const config = [
  {
    ignores: ["node_modules/**", ".next/**", "db/migrations/**", "coverage/**"],
  },
  ...nextConfig,
];

export default config;
