import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  // Scope schema introspection to our app's tables only. Without this
  // drizzle-kit walks every table in the `public` schema and trips on
  // Supabase-managed CHECK constraints whose format it doesn't parse.
  tablesFilter: ["dishes", "videos", "attempts", "steps", "youtube_cache"],
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@127.0.0.1:54322/postgres",
  },
});
