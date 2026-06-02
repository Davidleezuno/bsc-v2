# BSC v2

React + TanStack Router/Query boilerplate for Cloudflare Pages, backed by Supabase Postgres through Drizzle and Cloudflare Hyperdrive.

## Stack

- React 18 and Vite
- TanStack Router and TanStack Query
- Cloudflare Pages Functions for API routes
- Drizzle ORM with Supabase Postgres via Cloudflare Hyperdrive
- Supabase browser client for public client-side integration

## Local Setup

```bash
npm install
cp .env.example .env.local
cp .dev.vars.example .dev.vars
npm run db:generate
npm run db:migrate
npm run dev
```

`npm run dev` builds the app and runs Cloudflare Pages locally so `/api/*` functions are available. Use `npm run vite:dev` for plain Vite-only frontend development. Pages Functions read secrets from `.dev.vars` locally and Cloudflare environment variables in production.

For local Pages development, `npm run dev` maps `DATABASE_URL` from `.env.local` or `.dev.vars` to Cloudflare's `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` variable. This gives the local `HYPERDRIVE` binding a connection string without committing credentials to `wrangler.toml`.

## Hyperdrive Setup

Create a Hyperdrive configuration that points at your Supabase Postgres connection string:

```bash
npx wrangler hyperdrive create bsc-v2-db --connection-string="postgresql://..."
```

Copy the returned Hyperdrive id into `wrangler.toml` under the `HYPERDRIVE` binding before deploying.

## Cloudflare Deploy

Set these environment variables in Cloudflare Pages:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Also configure the `HYPERDRIVE` binding in `wrangler.toml` with your real Hyperdrive id.

Then deploy:

```bash
npm run cf:deploy
```

`VITE_SUPABASE_PUBLISHABLE_KEY` is safe for the browser when Row Level Security and policies are configured. `SUPABASE_SECRET_KEY` must stay server-only and should be configured as a Cloudflare secret/environment variable, not committed to `wrangler.toml`.

`DATABASE_URL` is still used locally for Drizzle migrations and local Hyperdrive development. In deployed Pages Functions, the server-side Drizzle client uses `env.HYPERDRIVE.connectionString`. The app keeps Drizzle on the server side in Pages Functions and exposes only API endpoints to the browser.
