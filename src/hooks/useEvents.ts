import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/lib/database.types";

export type EventSpeaker = Tables<"event_speakers">;
export type EventRow = Tables<"events"> & {
  event_speakers: EventSpeaker[];
};
export type EventWithCount = EventRow & {
  registered_count: number;
  checked_in_count: number;
};

/** All events + their speakers, joined with public registration counts. */
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async (): Promise<EventWithCount[]> => {
      const [{ data: events, error }, { data: counts, error: countErr }] =
        await Promise.all([
          supabase
            .from("events")
            .select("*, event_speakers(*)")
            .order("starts_at", { ascending: true }),
          supabase.from("event_registration_counts").select("*"),
        ]);
      if (error) throw error;
      if (countErr) throw countErr;

      const byId = new Map(counts?.map((c) => [c.event_id, c]));
      return (events ?? []).map((e) => ({
        ...(e as EventRow),
        registered_count: byId.get(e.id)?.registered_count ?? 0,
        checked_in_count: byId.get(e.id)?.checked_in_count ?? 0,
      }));
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["event", id],
    enabled: !!id,
    queryFn: async (): Promise<EventWithCount | null> => {
      const [{ data: event, error }, { data: count }] = await Promise.all([
        supabase
          .from("events")
          .select("*, event_speakers(*)")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("event_registration_counts")
          .select("*")
          .eq("event_id", id)
          .maybeSingle(),
      ]);
      if (error) throw error;
      if (!event) return null;
      return {
        ...(event as EventRow),
        registered_count: count?.registered_count ?? 0,
        checked_in_count: count?.checked_in_count ?? 0,
      };
    },
  });
}
