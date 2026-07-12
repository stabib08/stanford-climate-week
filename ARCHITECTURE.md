# Stanford Climate Week — Architecture Blueprint

A conference platform (iOS · Android · Web) for 1,000+ attendees of Stanford Climate Week (Oct 19–25, 2026), built on a single TypeScript codebase.

**Stack:** Expo (React Native) + Expo Router · NativeWind · Supabase (Postgres, Auth, Realtime, Storage) · React Query · React Hook Form + Zod · EAS + Vercel.

**Live backend:** Supabase project `gtrfhkndwawugqalsonv` (region `us-west-1`). URL and publishable key are in `.env.example`. The full schema is reproduced in `supabase/migrations/`.

---

## 0. System overview

### Top-level directory layout

```
stanford-climate-week/
├── app/                         # Expo Router routes (file-based navigation)
│   ├── _layout.tsx              # Providers + auth/onboarding navigation gate
│   ├── (auth)/                  # Signed-out stack: sign-in, magic-link/SSO callback
│   ├── (onboarding)/            # Profile creation wizard (blocks until complete)
│   ├── (tabs)/                  # Signed-in bottom tabs
│   │   ├── events/              #   Feature 2: agenda feed + detail
│   │   ├── inbox/               #   Feature 3: DMs + blasts
│   │   ├── my-events.tsx        #   Registered events + survey entry
│   │   └── profile.tsx          #   Own profile
│   ├── survey/                  # Feature 4: post-event + post-SCW surveys (modal)
│   └── admin/                   # Attendance tracker (organizers / event leads)
├── src/
│   ├── lib/                     # supabase client, generated DB types, constants
│   ├── providers/               # AuthProvider, QueryProvider
│   ├── hooks/                   # React Query data hooks (one file per domain)
│   ├── schemas/                 # Zod schemas (validation source of truth)
│   ├── components/{ui,events,inbox,survey}/
│   └── utils/                   # dates, calendar export, cn()
├── supabase/migrations/         # SQL — the database as code
├── content/events.json          # The agenda as data (edited via GitHub only)
└── scripts/seed-events.mjs       # Idempotent agenda sync (service role)
```

### The three-tier trust model

Every table has Row-Level Security (RLS) **on** with an explicit policy per operation. Three trust tiers are expressed through Postgres `SECURITY DEFINER` helper functions that read the caller's `auth.uid()`:

| Helper | Meaning |
| --- | --- |
| `is_admin()` | SCW Impact Team — full read of demographics + survey data |
| `has_role('organizer' \| 'event_lead' \| …)` | Membership in `profiles.involvement[]` |
| `is_event_lead(event_id)` | Leads a specific event (via `event_leads`) |
| `is_registered(event_id)` | Registered/checked-in for a specific event |
| `is_conversation_participant(conv_id)` | Member of a DM thread |

These run as the table owner (bypassing RLS) so policies that call them never recurse. They are the single choke point for authorization — screens never decide "can this user do X"; the database does, and the UI merely reflects it.

### Auth & navigation gate

`app/_layout.tsx` wraps the tree in `QueryProvider` → `AuthProvider` and renders a `RootNavigator` that routes on two booleans:

```
no session                    → /(auth)/sign-in
session, onboarding_completed=false → /(onboarding)/profile
session, onboarding_completed=true  → /(tabs)/events
```

`AuthProvider` hydrates the persisted session on cold start, subscribes to `onAuthStateChange`, and starts/stops token auto-refresh with `AppState`. Sessions persist in **expo-secure-store** (Keychain/Keystore) on native and `AsyncStorage`/localStorage on web, chunked to fit SecureStore's 2 KB per-value limit.

---

## Feature 1 — Profile Creation (Auth + Onboarding)

### 1. Component / file structure

```
app/(auth)/sign-in.tsx        # email entry → magic link OR Stanford SSO
app/(auth)/callback.tsx       # deep-link target; exchangeCodeForSession()
app/(onboarding)/profile.tsx  # multi-section conditional form
src/schemas/profile.ts        # profileSchema + emailSchema + isStanfordEmail()
src/hooks/useProfile.ts       # useProfile / useRoles / useSaveProfile
src/components/ui/{Field,Input,Select,Checkbox,Button}.tsx
```

`sign-in.tsx` detects a Stanford address (`isStanfordEmail`) and swaps the primary CTA to **Continue with Stanford SSO** (`supabase.auth.signInWithSSO({ domain: 'stanford.edu' })`, opened via `expo-web-browser`); everyone else gets a passwordless **magic link** (`signInWithOtp`). Both return to `(auth)/callback`, which exchanges the code and hands off to the root navigator.

`profile.tsx` is a single scrolling form (not a paged wizard) whose Stanford vs. external branch reveals conditionally on the "Are you a Stanford student?" answer — the questions are few enough that one screen with progressive disclosure beats multi-step friction.

### 2. Database schema & security

`profiles` is 1:1 with `auth.users`; a trigger (`handle_new_user`) inserts a stub row on signup so the client only ever **updates**. Conditional integrity is enforced in the database, not just the client:

```sql
constraint stanford_fields_ck check (
  is_stanford_student is null
  or (is_stanford_student = true  and degree is not null and stanford_year is not null and area_of_study is not null)
  or (is_stanford_student = false and external_sector is not null)
),
constraint pain_point_other_ck check (
  climate_pain_point is distinct from 'other' or climate_pain_point_other is not null
)
```

**RLS (strict):** a user reads/writes only their own row (`id = auth.uid()`); `is_admin()` grants the Impact Team read access. Demographics (pain points, sector, location, email) are therefore invisible to other attendees. A guard trigger blocks anyone but an admin from flipping `is_admin`, so a user cannot escalate privileges by writing their own row. Public, non-sensitive fields (name, avatar, involvement) are exposed to all signed-in users through the `directory_profiles` view for the DM directory and speaker linking.

### 3. Data fetching & state

`useProfile()` is the app-wide source of identity (`queryKey: ['profile', userId]`); the navigation gate, tab bar, and role checks all read it. `useRoles()` derives `isOrganizer / isEventLead / isAdmin / onboardingCompleted` from it. `useSaveProfile()` upserts and then `setQueryData` to update the gate instantly (no refetch flash before redirect to the tabs).

### 4. Validation schemas

`profileSchema` (in `src/schemas/profile.ts`) uses `.superRefine()` to mirror the DB CHECK constraints — required Stanford fields when `is_stanford_student`, required sector/background otherwise, and required free-text when pain point is `other`. `involvement` is `z.array(...).min(1)`. Client and database enforce the *same* invariants, so a malformed payload is rejected twice.

### 5. UI states

- **Loading** — root shows `Loading("Warming up…")` while the session + profile resolve; save button shows an inline spinner (`save.isPending`).
- **Error** — field-level messages under each `Field`; a form-level banner on `save.isError` ("Couldn't save… try again"). SSO/magic-link failures render inline under the CTA.
- **Empty** — first run: form is blank with placeholders; `sign-in` shows the branded hero.
- **Success** — magic-link screen switches to a "📬 Check your email" confirmation; a completed profile auto-redirects to `/(tabs)/events`.

### 6. Edge cases

- **Magic link opened on another device** → session lands where the link was tapped; SecureStore is per-device, so the user simply re-requests on the intended device. Copy sets this expectation.
- **SSO not yet configured** → `signInWithSSO` returns an error; the UI surfaces "Stanford SSO is not configured yet" and offers the magic-link fallback so onboarding never dead-ends.
- **Duplicate profile row** → impossible; `handle_new_user` uses `on conflict (id) do nothing` and the client upserts.
- **Token expiry mid-session** → `autoRefreshToken` + `AppState` refresh on foreground; a hard 401 clears the session and the gate routes back to sign-in.
- **Offline submit** → mutation rejects; React Query surfaces `isError` and the entered values remain in the form for retry.

---

## Feature 2 — Event Feed, Registration & Check-in

### 1. Component / file structure

```
app/(tabs)/events/_layout.tsx      # nested stack (feed → detail)
app/(tabs)/events/index.tsx        # feed with List / By-day toggle
app/(tabs)/events/[id].tsx         # detail + sticky register/check-in bar
app/(tabs)/my-events.tsx           # registered events + post-event survey CTA
app/admin/event/[id]/attendance.tsx# organizer/lead attendance roster + stats
src/components/events/{EventCard,SpeakerRow}.tsx
src/hooks/useEvents.ts             # useEvents / useEvent (joined with counts)
src/hooks/useRegistration.ts       # register / cancel / check-in / attendance
src/utils/calendar.ts              # device calendar + web .ics export
content/events.json + scripts/seed-events.mjs   # events-as-code
```

The feed offers both requested displays: a flat **List** (`FlatList`) and a **By-day** view (`SectionList` grouped by calendar day, sticky headers) — toggled by a segmented control.

### 2. Database schema & security

`events` (+ `event_speakers`, `event_leads`) with a 50-word description cap (`char_length ≤ 400` at the DB + a word-count check in `eventSchema`). `event_registrations` carries `status ∈ {registered, cancelled, checked_in}`, `unique(event_id, user_id)`, and check-in/cancel timestamps.

**Events are read-only from the app.** RLS `events_select using (true)` for all authenticated users; writes are limited to `is_admin() OR has_role('organizer')`. In practice the agenda is authored via `content/events.json` and pushed by `scripts/seed-events.mjs` (service role) — satisfying "only people with GitHub access can add an event."

**Registrations:** insert/update/delete gated to `user_id = auth.uid()` (a user registers, cancels, and checks in only *themselves*); reads additionally allowed to admins, organizers, and the event's leads for the attendance roster. Individual registration rows never leak — the public **registered count** comes from the aggregate `event_registration_counts` view, so no attendee can enumerate who else registered.

### 3. Data fetching & state

`useEvents()` fetches `events` + embedded `event_speakers` and joins the `event_registration_counts` view client-side into `registered_count` / `checked_in_count`. Mutations (`useRegister`, `useCancelRegistration`, `useCheckIn`) invalidate `['events']`, `['event', id]`, `['registration', id, userId]`, and `['my-registrations', userId]` in one pass, so the count and button state update everywhere at once. `useRegister` upserts on the unique key, which re-activates a previously cancelled row in a single round-trip.

### 4. Validation schemas

`eventSchema` (`src/schemas/event.ts`) validates the authoring pipeline: the 50-word description limit, `ends_at > starts_at`, and speaker shape. The app itself submits no event data, so the runtime validation surface for users is limited to the register/check-in actions (which carry no free-form input).

### 5. UI states

- **Loading** — `Loading("Loading the agenda…")`; detail shows a full-screen spinner.
- **Error** — `ErrorState` with a **Try again** that calls `refetch`.
- **Empty** — `Empty("No events yet", 📅)`; My Events shows an empty state with a "Browse the agenda" CTA.
- **Success** — register triggers an alert offering calendar add; the sticky bar transitions Register → (Add to calendar / Cancel) → **Check in now** (inside the window) → "✓ Checked in".

### 6. Edge cases

- **Check-in window** — `isWithinCheckInWindow()` opens the check-in button 10 minutes before `starts_at` and closes it at `ends_at`; outside that range the button is hidden. `useCheckIn` also guards `.eq('status','registered')` so a double-tap can't downgrade a checked-in row.
- **Double registration / race** — the `unique(event_id, user_id)` constraint + upsert makes registration idempotent; concurrent taps converge to one row.
- **Cancel then re-register** — modeled as a status flip (not a delete), preserving the original `registered_at` for analytics and keeping counts correct.
- **Calendar permission denied** — registration still succeeds; the calendar step degrades to an explanatory alert. On web, calendar add generates a downloadable `.ics` instead of touching a native calendar.
- **Stale counts** — counts come from a view queried alongside events; any register/cancel invalidates `['events']`, so the feed reconciles on next focus.

---

## Feature 3 — DM Inbox & Organizer Blasts

### 1. Component / file structure

```
app/(tabs)/inbox/index.tsx            # unified inbox (DMs + blasts, merged)
app/(tabs)/inbox/[conversationId].tsx # iMessage-style thread (realtime)
app/(tabs)/inbox/new.tsx              # directory search → start/open DM
app/(tabs)/inbox/blast.tsx            # organizer/lead blast composer
src/components/inbox/MessageBubble.tsx
src/hooks/useMessages.ts              # thread + realtime + start conversation
src/hooks/useInbox.ts                 # merged inbox + send blast
src/hooks/useDirectory.ts             # attendee search (directory_profiles)
```

### 2. Database schema & security

Two distinct primitives, deliberately kept separate:

- **1-on-1 DMs** — `conversations` + `conversation_participants` + `messages`. Visibility is gated by `is_conversation_participant()`; a message insert requires `sender_id = auth.uid()` **and** membership. Only conference members message each other, one thread per pair.
- **Blasts** — `blasts(sender_id, audience, event_id, subject, body)`. A blast is **broadcast, not fanned out**: one row, and RLS decides who can see it. This is the key scaling decision — a welcome blast to 1,000 attendees is a single insert, not 1,000 rows.

**Who can blast (insert policy):**

```sql
sender_id = auth.uid() and (
  (audience = 'all_attendees'     and has_role('organizer')) or
  (audience = 'event_registrants' and (has_role('organizer') or is_event_lead(event_id)))
)
```

So organizers can address all attendees or any event's registrants; event leads can address *only their own* event's registrants; attendees cannot blast at all. **Who receives a blast (select policy):** `all_attendees` blasts are visible to every signed-in user; `event_registrants` blasts are visible only to `is_registered(event_id)`.

### 3. Data fetching & state

`useInbox()` fetches conversations (with the other participant's name via the `directory_profiles` embed and the latest message) and visible blasts, then merges and sorts by recency into a single `InboxItem[]`. `useMessages(conversationId)` loads the thread and opens a **Supabase Realtime** channel filtered to that conversation, appending inserts live (dedup-guarded). `useStartConversation()` finds an existing shared thread before creating one, so re-messaging someone reuses the thread.

### 4. Validation schemas

`messageSchema` (1–4000 chars, trimmed, non-empty) and `blastSchema` (`.superRefine` requires `event_id` when `audience = 'event_registrants'`) in `src/schemas/message.ts`. The DB mirrors both: a `char_length between 1 and 4000` check on `messages.body`/`blasts.body` and the `blast_audience_ck` constraint tying audience to the presence of `event_id`.

### 5. UI states

- **Loading** — inbox and thread show spinners; the composer's send button spins on `isPending`.
- **Error** — `ErrorState` with retry on both inbox and thread.
- **Empty** — inbox shows "No messages yet" with a **New message** CTA; a fresh thread reads "Say hello 👋".
- **Success** — optimistic send clears the input immediately; on failure the text is **restored** to the box so nothing is lost. Realtime delivers the counterpart's messages without a refetch.

### 6. Edge cases

- **Blast permission drift** — even if the compose UI is reached, the RLS insert policy is the real gate; an event lead selecting another lead's event is rejected server-side, surfaced as "You may not have permission for this audience."
- **Scale** — because blasts aren't materialized per recipient, a 1,000-person welcome message is O(1) writes; recipient visibility is computed at read time by RLS.
- **Realtime drop** — if the socket disconnects, the thread still shows the initial fetch; React Query refetches on remount, and `send` invalidates the inbox so ordering stays correct.
- **Messaging yourself / duplicate threads** — `new.tsx` filters the current user out of the directory; `useStartConversation` dedupes existing pairs before inserting.
- **Empty/whitespace message** — blocked by `messageSchema` before insert and by the DB check as a backstop.

---

## Feature 4 — Post-Event Data Collection

### 1. Component / file structure

```
app/survey/event/[id].tsx   # per-event micro-survey (modal presentation)
app/survey/post-scw.tsx     # end-of-week survey (flexible, TBD instrument)
src/components/survey/LikertScale.tsx   # 1–5 warm/cold scale
src/hooks/useSurvey.ts      # usePostEventSurvey / useSubmitPostEventSurvey
src/schemas/survey.ts       # postEventSurveySchema / postScwSurveySchema
```

Entry points: **My Events** surfaces a "Share post-event feedback" CTA on events that have ended and were checked into.

### 2. Database schema & security

`post_event_surveys(event_id, user_id, learning_scale 1–5, most_helpful ENUM, other_thoughts, unique(event_id,user_id))`. **Insert requires `is_registered(event_id)`** — you can only rate an event you registered for. Reads are limited to the author, admins, organizers, and that event's leads, so aggregate analysis is possible without exposing one attendee's response to another. `post_scw_surveys` stores responses as `jsonb` keyed by `user_id` (one per user) because the final instrument is still TBD — the Impact Team can finalize questions without a schema migration.

### 3. Data fetching & state

`usePostEventSurvey(id)` checks for an existing submission to drive the "already completed" state; `useSubmitPostEventSurvey(id)` upserts on `(event_id, user_id)` so a resubmit edits in place, then invalidates the survey query.

### 4. Validation schemas

`postEventSurveySchema`: `learning_scale` int 1–5 (required), `most_helpful` enum (required), `other_thoughts` optional ≤1000. `postScwSurveySchema`: all-optional (rating, would-return, highlight, improvements) since it's exploratory. DB backstops: `learning_scale between 1 and 5`, `most_helpful` typed as the `survey_category` enum.

### 5. UI states

- **Loading** — spinner while checking for a prior submission.
- **Error** — mutation errors keep the form populated for retry.
- **Empty** — the blank two-question form (under 30 seconds by design).
- **Success** — submit dismisses the modal; a returning user sees "✅ Thanks for your feedback!" instead of the form (idempotent via the unique constraint).

### 6. Edge cases

- **Survey without attendance** — insert is blocked by `is_registered(event_id)`; the CTA only appears for checked-in, ended events.
- **Duplicate submission** — `unique(event_id, user_id)` + upsert; the UI short-circuits to the thank-you state.
- **Evolving post-SCW questions** — `jsonb` responses avoid migrations as the instrument changes.
- **Offline** — same pattern as other mutations: values retained, retry on reconnect.

---

## Cross-cutting: security posture & known advisor findings

Supabase's security advisor was run after every schema change. The final state:

- **All 11 tables have RLS enabled** with explicit per-operation policies.
- **Trigger-only functions** (`handle_new_user`, `bump_conversation`, `guard_profile_privileges`) have `EXECUTE` revoked from `anon`/`authenticated` so they aren't callable as RPCs.
- **Public storage buckets** dropped their broad listing policies (objects remain reachable by direct CDN URL).
- **Remaining advisor notices are intentional and documented:**
  - *5 × "SECURITY DEFINER function executable by authenticated"* on the RLS helpers (`is_admin`, `has_role`, `is_event_lead`, `is_registered`, `is_conversation_participant`). This is required — RLS policy expressions are evaluated as the calling role, so `authenticated` must hold `EXECUTE`. The functions only return booleans about the caller and take no unsafe input.
  - *2 × "Security Definer View"* on `directory_profiles` and `event_registration_counts`. These are deliberate minimal-exposure surfaces: the directory exposes only name/avatar/involvement/is-student for onboarded users, and the counts view exposes only aggregates. Both are revoked from `anon` and granted only to `authenticated`. Making them `security_invoker` would either break the directory (profiles RLS hides other users) or the counts (an attendee would count only their own row).

**Recommended dashboard settings** (not expressible in SQL): enable leaked-password protection and configure the Stanford SAML provider under Auth → Providers.

---

## Deployment

- **Mobile:** `eas build` (profiles in `eas.json`) → App Store / Google Play; `eas update` for OTA JS pushes on the `preview`/`production` channels.
- **Web:** `expo export -p web` produces a static `dist/` deployed to Vercel; `detectSessionInUrl` is enabled on web so magic-link/OAuth redirects resolve.
- **Agenda:** edits to `content/events.json` merged to `main` run `scripts/seed-events.mjs` (wire into CI with `SUPABASE_SERVICE_ROLE_KEY`).
- **Types:** regenerate `src/lib/database.types.ts` with `npm run gen:types` after any schema change.

## First-run checklist

1. `cp .env.example .env` (URL + publishable key already filled for the live project).
2. `npm install`
3. `npx expo start` (press `i` / `a` / `w`).
4. First account → onboarding form → tabs. To grant yourself Impact-Team access: set `is_admin = true` on your `profiles` row (SQL editor / service role). To test organizer blasts, add `'organizer'` to your `involvement` array.
