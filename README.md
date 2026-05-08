# moyo

Next.js App Router MVP for the `docs/moyo` product spec.

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.local.example .env.local
```

3. Fill in `.env.local`.

## Environment Variables

All local secrets live in `.env.local`. Keep `.env.local` uncommitted; use `.env.local.example` as the template.

| Variable                               | Where to get it                                                                                                            | Notes                                                                                                                                                                                                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                         | Supabase Dashboard → your project → Project Settings → Database → Connection string → URI                                  | Use the direct Postgres URI for Drizzle queries and migrations. Replace the password placeholder with the database password you set for the project. For local Supabase, the example value usually works: `postgres://postgres:postgres@127.0.0.1:54322/postgres`. |
| `DIRECT_DATABASE_URL`                  | Same place as `DATABASE_URL`                                                                                               | This app uses it first when present. For local development, set it to the same value as `DATABASE_URL` unless you intentionally need a different direct connection string.                                                                                         |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase Dashboard → Project Settings → API → Project URL                                                                  | Safe to expose to the browser. It should look like `https://<project-ref>.supabase.co`.                                                                                                                                                                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Project Settings → API → Project API keys → `anon` / `public` key                                     | Safe to expose to the browser. Used by Supabase Auth.                                                                                                                                                                                                              |
| `SUPABASE_SERVICE_ROLE_KEY`            | Supabase Dashboard → Project Settings → API → Project API keys → `service_role` key                                        | Server-only. Never expose this with a `NEXT_PUBLIC_` prefix, and do not paste it into client components.                                                                                                                                                           |
| `YOUTUBE_API_KEY`                      | Google Cloud Console → APIs & Services → Library → enable YouTube Data API v3 → Credentials → Create credentials → API key | Server-only. Restrict the key in Google Cloud when possible. The app uses it from API routes for search, video details, and top comment fetches.                                                                                                                   |

Supabase Auth also needs Google OAuth configured before the real login flow works:

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID.
2. Add the Supabase callback URL from Supabase Dashboard → Authentication → Providers → Google.
3. Copy the Google client ID and client secret into that Supabase Google provider form.
4. Add your email to the `allowed_users` table after running migrations.

5. Apply the schema to local Supabase/Postgres:

```bash
pnpm drizzle-kit push
```

5. Run the app:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm vitest run
pnpm build
pnpm drizzle-kit generate
```

## Manual QA

- TC-19: search a dish, open a video, set thumbs up, search again, and confirm the liked section appears above the latest section.
- TC-20: open a video detail page, select `기록하기`, add an attempt with a step timestamp, save, and confirm the attempt count increments after refresh.

OAuth and live YouTube calls require valid Supabase and YouTube environment variables in `.env.local`.
