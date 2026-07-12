# Stanford Climate Week

The official conference app for **Stanford Climate Week** (Oct 19–25, 2026) — iOS, Android, and Web from one TypeScript codebase. Attendees browse the agenda, register and check in, message the community, and share feedback; the SCW Impact Team gets secure, private demographic and outcome data on the backend.

> **Full technical design:** see [`ARCHITECTURE.md`](./ARCHITECTURE.md) — file structure, database schema + RLS, data hooks, Zod schemas, UI states, and edge cases for every feature.

## Stack

| Layer | Choice |
| --- | --- |
| App | Expo (React Native) + Expo Router — iOS / Android / Web |
| Styling | NativeWind (Tailwind for RN) |
| Backend | Supabase — Postgres, Auth, Realtime, Storage |
| Auth | Supabase Auth — magic links + Stanford SSO (SAML) |
| Forms | React Hook Form + Zod |
| Server state | TanStack React Query |
| Ship | EAS (mobile) · Vercel (web) |

## Features

1. **Profiles & auth** — magic-link or Stanford SSO sign-in, then a conditional onboarding form capturing demographics + climate intent (RLS-protected, admin-readable).
2. **Event feed** — list & by-day views, registration with live counts, calendar export, a 10-minute check-in window, and an admin attendance tracker. Events are authored via `content/events.json` (GitHub-only), not the app.
3. **Inbox** — iMessage-style 1-on-1 DMs (realtime) plus organizer/event-lead **blasts** that scale to 1,000+ attendees without per-recipient fan-out.
4. **Surveys** — a 30-second post-event micro-survey (attendance-gated) and a flexible post-SCW survey.

## Getting started

```bash
cp .env.example .env      # live Supabase URL + publishable key are pre-filled
npm install
npx expo start            # then press i (iOS), a (Android), or w (Web)
```

## Backend

Live Supabase project: `gtrfhkndwawugqalsonv` (`us-west-1`). The entire schema — tables, RLS policies, helper functions, views, storage, and hardening — is reproduced in [`supabase/migrations/`](./supabase/migrations). Regenerate types after schema changes:

```bash
npm run gen:types
```

## Managing the agenda

Edit [`content/events.json`](./content/events.json) and run the idempotent sync (service-role key required):

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-events.mjs
```

On GitHub, this runs automatically: `.github/workflows/seed-events.yml` syncs the agenda whenever `content/events.json` changes on `main` (add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as repo secrets). `.github/workflows/ci.yml` typechecks every PR.

## Stanford SSO

The app is wired for Stanford SAML sign-in; registering the identity provider is a one-time server step. See [`docs/SSO_SETUP.md`](./docs/SSO_SETUP.md) and `scripts/setup-sso.mjs`.

## Project layout

```
app/        Expo Router routes (auth, onboarding, tabs, survey, admin)
src/        lib · providers · hooks · schemas · components · utils
supabase/   SQL migrations (database as code)
content/    events.json — the agenda as versioned data
scripts/    seed-events.mjs — agenda sync
```

## Assets

`assets/` currently holds solid-green placeholder icon/splash images — replace them with final SCW branding before store submission.
