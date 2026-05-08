import nextConfig from "eslint-config-next";

const config = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "src/db/migrations/**",
      "coverage/**",
    ],
  },
  ...nextConfig,
];

export default config;
