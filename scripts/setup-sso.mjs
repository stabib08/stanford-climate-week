/**
 * Register (or update) Stanford SAML SSO on the Supabase project.
 *
 * Prerequisites (see docs/SSO_SETUP.md):
 *   - Supabase project on a plan that includes SSO (Pro or above).
 *   - Stanford IdP metadata URL or XML from Stanford University IT.
 *   - The project's SERVICE ROLE key (Dashboard → Settings → API).
 *
 * Usage:
 *   SUPABASE_URL=https://gtrfhkndwawugqalsonv.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   STANFORD_SAML_METADATA_URL=https://login.stanford.edu/.../metadata.xml \
 *   node scripts/setup-sso.mjs
 *
 * Or provide metadata as a local file with STANFORD_SAML_METADATA_FILE=./stanford-idp.xml
 */
import { readFile } from "node:fs/promises";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const metadataUrl = process.env.STANFORD_SAML_METADATA_URL;
const metadataFile = process.env.STANFORD_SAML_METADATA_FILE;
const DOMAIN = "stanford.edu";

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!metadataUrl && !metadataFile) {
  console.error("Set STANFORD_SAML_METADATA_URL or STANFORD_SAML_METADATA_FILE.");
  process.exit(1);
}

const base = `${url}/auth/v1/admin/sso/providers`;
const headers = {
  Authorization: `Bearer ${key}`,
  apikey: key,
  "Content-Type": "application/json",
};

// Map SAML assertion attributes -> Supabase user fields.
// Adjust the `name` keys to match Stanford's actual assertion attribute names.
const attribute_mapping = {
  keys: {
    email: { name: "urn:oid:0.9.2342.19200300.100.1.3" }, // mail
    name: { name: "urn:oid:2.16.840.1.113730.3.1.241" }, // displayName
    full_name: { name: "urn:oid:2.16.840.1.113730.3.1.241" },
  },
};

const body = {
  type: "saml",
  domains: [DOMAIN],
  attribute_mapping,
  ...(metadataUrl
    ? { metadata_url: metadataUrl }
    : { metadata_xml: await readFile(metadataFile, "utf8") }),
};

// Is there already a provider for stanford.edu?
const listRes = await fetch(base, { headers });
if (!listRes.ok) {
  console.error(`List failed (${listRes.status}). Confirm the service-role key and that SSO is enabled on your plan.`);
  console.error(await listRes.text());
  process.exit(1);
}
const { items = [] } = await listRes.json();
const existing = items.find((p) => (p.domains ?? []).some((d) => d.domain === DOMAIN));

const res = await fetch(existing ? `${base}/${existing.id}` : base, {
  method: existing ? "PUT" : "POST",
  headers,
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error(`${existing ? "Update" : "Create"} failed (${res.status}):`);
  console.error(await res.text());
  process.exit(1);
}

const provider = await res.json();
console.log(`\n✅ Stanford SSO ${existing ? "updated" : "created"} — provider id ${provider.id}\n`);
console.log("Give these Service Provider (SP) details to Stanford University IT:");
console.log(`  • SP metadata URL : ${url}/auth/v1/sso/saml/metadata`);
console.log(`  • ACS (reply) URL : ${url}/auth/v1/sso/saml/acs`);
console.log(`  • Entity ID       : ${url}/auth/v1/sso/saml/metadata`);
console.log(`  • Login domain    : ${DOMAIN}`);
console.log("\nThe app already calls signInWithSSO({ domain: 'stanford.edu' }) — no client change needed.");
