# Stanford SAML SSO — setup

The app is already wired for Stanford single sign-on: `app/(auth)/sign-in.tsx`
detects a `@stanford.edu` address and calls
`supabase.auth.signInWithSSO({ domain: 'stanford.edu' })`, and
`app/(auth)/callback.tsx` completes the exchange. What remains is registering the
Stanford identity provider (IdP) on the Supabase side. That step needs inputs
only you and Stanford University IT can provide, so it can't be scripted blind.

## What you need to gather

1. **A Supabase plan that includes SSO.** SAML SSO is a paid feature (Pro plan or
   above). The project is currently on the free tier — upgrade the
   `stanford-climate-week` project first, or SSO endpoints will 404.
2. **The project SERVICE ROLE key.** Supabase Dashboard → Project Settings → API
   → `service_role`. Treat it like a password; never commit it or ship it in the
   app. It is only used server-side (this script / CI secrets).
3. **Stanford's IdP metadata**, from Stanford University IT (the team that runs
   Stanford's Shibboleth/SAML identity provider). Ask them for either:
   - a **metadata URL** (preferred — auto-refreshes on cert rotation), or
   - a **metadata XML** file.
   Also confirm the **assertion attribute names** they release for email and
   display name (Stanford typically releases eduPerson/OID attributes).

## Register the provider

```bash
SUPABASE_URL=https://gtrfhkndwawugqalsonv.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
STANFORD_SAML_METADATA_URL=<stanford_idp_metadata_url> \
node scripts/setup-sso.mjs
```

The script prints the **Service Provider (SP)** details to hand back to Stanford
IT so they can register this app in their IdP:

| Field | Value |
| --- | --- |
| SP metadata URL | `https://gtrfhkndwawugqalsonv.supabase.co/auth/v1/sso/saml/metadata` |
| ACS / reply URL | `https://gtrfhkndwawugqalsonv.supabase.co/auth/v1/sso/saml/acs` |
| Entity ID | `https://gtrfhkndwawugqalsonv.supabase.co/auth/v1/sso/saml/metadata` |
| Login domain | `stanford.edu` |

## Attribute mapping

`setup-sso.mjs` maps SAML attributes → Supabase user fields. The defaults use the
standard OIDs for `mail` and `displayName`; if Stanford releases different
attribute names, update the `attribute_mapping.keys` block in the script and
re-run it. On first SSO login, `handle_new_user` creates the `profiles` row from
the mapped email/name, then the user completes onboarding as normal.

## Verify

1. In the app, enter a `@stanford.edu` email → **Continue with Stanford SSO**.
2. You should be redirected to Stanford's login, then back to `(auth)/callback`.
3. Confirm a session exists and the onboarding form loads.

Until SSO is enabled, Stanford users can still sign in via the **magic link**
fallback — no one is blocked.
