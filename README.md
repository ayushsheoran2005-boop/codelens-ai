# CodeLens AI

CodeLens AI is a React/Vite frontend with an authenticated API for Gemini-backed code review. Review source is sent to the configured CodeLens API and Gemini, then stored in Supabase. It is not a substitute for a human security review, and generated findings or fixes are not verified.

## Deployment overview

- **Frontend:** Vercel (Vite static build)
- **API:** Render (Node.js web service in `backend/`)
- **Authentication and review history:** Supabase Auth and Postgres with row-level security
- **AI:** Gemini API, called only from the backend

No hosted deployment or live account flow has been performed from this repository. The application requires provider accounts, the Supabase schema setup, deployment URLs, and the environment variables below before it can run as a hosted service.

## Local development

Requirements: Node.js 22.x and npm.

1. Copy `.env.example` to `.env.local` in the project root. For local use, set `VITE_API_BASE_URL=http://localhost:10000` and fill in the Supabase frontend values.
2. Copy `backend/.env.example` to `backend/.env` and fill in the backend values.
3. Apply [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor.
4. Install and start the frontend:

   ```sh
   npm ci
   npm run dev
   ```

5. In another terminal, install and start the API:

   ```sh
   cd backend
   npm ci
   npm run dev
   ```

   The frontend uses `http://localhost:10000` as its default API port only when you explicitly set that value in `.env.local`; the API permits the Vite localhost origin during non-production development.

6. Verify the API is responding at `http://localhost:10000/healthz`.

Never put `GEMINI_API_KEY`, a Supabase `service_role` key, database password, or other server credential in a `VITE_` variable. Vite embeds `VITE_` values in public browser assets. The frontend only needs the Supabase **publishable/anon** key and project URL.

## Environment variables

### Vercel frontend

Set these in the Vercel project settings for Production (and Preview only if you also configure matching Supabase redirect URLs and API CORS origins):

| Variable | Required | Value |
|---|---:|---|
| `VITE_API_BASE_URL` | Yes | Render API origin, e.g. `https://codelens-api.onrender.com` (no path or trailing slash) |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL, e.g. `https://project-ref.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase publishable key, or legacy anon public key; safe for browser use when RLS is enabled |

These are build-time variables. Redeploy after changing them.

### Render backend

The Render Blueprint [`render.yaml`](./render.yaml) creates the web service from the `backend/` directory and checks `/healthz`. Set the following in Render's backend environment settings:

| Variable | Required | Value |
|---|---:|---|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Render-managed | Render supplies the listening port; the Blueprint fallback is `10000` |
| `FRONTEND_ORIGIN` | Yes | Exact deployed frontend origin, e.g. `https://codelens-ai.vercel.app`, with no path or trailing slash |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase publishable/anon key; the API verifies the caller's access token and forwards it so database RLS is enforced |
| `GEMINI_API_KEY` | Yes | Secret Gemini key stored only in Render |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash`; confirm this model is enabled and eligible for the selected Gemini account/region |
| `MAX_CODE_BYTES` | No | Defaults to 80,000; capped at 100,000 |
| `MAX_REPOSITORY_FILES` | No | Defaults to 8; capped at 15 |
| `MAX_REPOSITORY_BYTES` | No | Defaults to 60,000; capped at 100,000 |

`backend/.env.example` documents the local backend variables. Never add real `.env` files to source control.

## Supabase setup

1. Create a Supabase project and keep its database password private.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) once in the project's SQL Editor. This creates the reviews table, account-scoped RLS policies, and index.
3. In **Authentication → URL Configuration**, set **Site URL** to the production Vercel origin. Add exact redirect URLs for:
   - `https://YOUR-VERCEL-DOMAIN/auth`
   - `http://localhost:5173/auth` for local development
   - Any production custom domain's `/auth` callback, if applicable
4. Configure email confirmation and password/security policies as appropriate for the application.
5. Use the project's publishable/anon key in the frontend and backend. This application does not need or use the service-role key.

Email confirmation links use Supabase PKCE, so open the link in the same browser where you signed up. If confirmation redirects to an error, verify the exact `/auth` URL for the active domain is in Supabase's redirect allowlist.

The API authenticates every `/api/*` request with Supabase Auth and uses the caller's JWT for Postgres requests. The schema enables and forces row-level security; users can select, insert, and delete only rows where `user_id = auth.uid()`. Do not disable RLS or grant `anon` access to review rows. Existing local-demo review data is not migrated.

## Gemini setup

Create a Gemini API key using Google's AI developer console and place it in Render's secret environment settings only. Requests have a 30-second provider timeout. Provider quota/rate exhaustion returns an explicit HTTP 429 error; the application does not fall back to a fake or local “AI” result. Revisit Google's current model availability, free-tier rules, data handling terms, and quota limits before public use; free access is subject to change and can depend on model, account, and region.

Submitted code and fetched public repository files are transmitted to Gemini for analysis. Do not submit confidential, regulated, or proprietary source unless the user and organization have approved that data handling.

## Vercel deployment

1. Push this project to a Git provider and import it into Vercel.
2. Keep the frontend root at the repository root. Vercel uses `npm run build`, `dist`, and the SPA rewrite in `vercel.json`.
3. Add the three frontend environment variables above to the Vercel **Production** environment.
4. Deploy and note the resulting HTTPS origin. Add it as `FRONTEND_ORIGIN` in Render and as the Supabase Site URL/redirect URL.
5. Redeploy Vercel after setting all final environment values.

## Render deployment

1. Create a Render Blueprint from the repository using [`render.yaml`](./render.yaml), or create a Node web service with root directory `backend`, build command `npm ci`, start command `npm start`, and health check `/healthz`.
2. Add the backend variables in Render. For CORS, use only the exact production Vercel origin. A local Vite origin is allowed only when `NODE_ENV` is not production.
3. Deploy, wait for the health check to pass, and set `VITE_API_BASE_URL` in Vercel to the resulting Render origin.
4. Redeploy the frontend, then test sign-up, email confirmation, sign-in/out, a small code submission, history retrieval/deletion, and a public repository. Test with separate user accounts to verify history isolation.

The API rate-limits general requests by IP and analysis to 8 requests per 15 minutes per authenticated account. Code requests are limited to 80 KB by default and JSON bodies to 300 KB. Repository analysis fetches a bounded number/size of supported source files from **public GitHub repositories only**; private repositories, GitHub authentication, and whole-repository completeness are not supported. Gemini results and suggested code are untrusted recommendations and are not executed, tested, or guaranteed correct.

## Free-tier limitations

Free tiers are provider-controlled and can change. Confirm current terms, quotas, geographic availability, and eligibility before launch:

- **Render:** free web services may sleep when idle, creating cold-start delays; they have usage, instance, and availability restrictions and are not a production SLA.
- **Vercel:** free/Hobby usage has build, bandwidth, and commercial-use restrictions; review the plan terms for the intended public/commercial project.
- **Supabase:** free projects have database, storage, authentication/email, and compute quotas; inactive projects may be paused; database backups and recovery guarantees may be limited.
- **Gemini:** free-tier requests are quota/rate limited, model/region dependent, and may change; exhaustion is surfaced to the user, not retried indefinitely.
- **GitHub:** unauthenticated public API requests have low rate limits. Repository review is bounded and may fail if GitHub limits or the repository tree is large.

## Verification and security notes

Run frontend verification from the repository root:

```sh
npm ci
npm run build
npm audit
```

Run backend tests and dependency checks:

```sh
cd backend
npm ci
npm test
npm audit
```

The health endpoint is `GET /healthz`. The API allows exactly the configured frontend origin in production and uses security headers, JSON/request-size limits, timeouts, an IP request limiter, strict public-GitHub URL validation, and Supabase user-token verification. The Gemini credential is used only server-side.

Before release, review the final production URLs, Supabase redirect allowlist and RLS policies, Render CORS origin, and provider logs. This workspace has no `.git` metadata, so its Git commit history cannot be inspected for accidentally committed secrets. The public deployment flow and third-party account behavior also cannot be verified until real provider projects, credentials, DNS/deployment URLs, and email confirmation are configured.
