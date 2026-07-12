/**
 * Seed / sync the SCW agenda from content/events.json.
 *
 * Events can ONLY be created by people with repo access (never via the app),
 * so this script is the single source of truth for the schedule. Run it in CI
 * or locally with the service-role key (which bypasses RLS):
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-events.mjs
 *
 * It is idempotent: matching an event by title updates it in place; speakers
 * are replaced to mirror the JSON exactly.
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const events = JSON.parse(await readFile(new URL("../content/events.json", import.meta.url)));

for (const e of events) {
  // Upsert the event by title (stable natural key for the agenda).
  const { data: existing } = await supabase
    .from("events")
    .select("id")
    .eq("title", e.title)
    .maybeSingle();

  const row = {
    title: e.title,
    description: e.description,
    starts_at: e.starts_at,
    ends_at: e.ends_at,
    location: e.location,
    cover_art_url: e.cover_art_url ?? null,
    format_tags: e.format_tags ?? [],
    sector_tags: e.sector_tags ?? [],
  };

  let eventId = existing?.id;
  if (eventId) {
    await supabase.from("events").update(row).eq("id", eventId);
    await supabase.from("event_speakers").delete().eq("event_id", eventId);
  } else {
    const { data, error } = await supabase.from("events").insert(row).select("id").single();
    if (error) throw error;
    eventId = data.id;
  }

  if (e.speakers?.length) {
    await supabase.from("event_speakers").insert(
      e.speakers.map((s, i) => ({
        event_id: eventId,
        name: s.name,
        role: s.role ?? null,
        sort_order: i,
      })),
    );
  }
  console.log(`✓ ${e.title}`);
}

console.log(`\nSynced ${events.length} events.`);
