import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { Tables } from "@/lib/database.types";

export type Registration = Tables<"event_registrations">;

/** The current user's registration for a single event (or null). */
export function useMyRegistration(eventId: string) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["registration", eventId, userId],
    enabled: !!userId && !!eventId,
    queryFn: async (): Promise<Registration | null> => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** All of the current user's registered/checked-in events (for "My Events"). */
export function useMyRegistrations() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["my-registrations", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*, events(*, event_speakers(*))")
        .eq("user_id", userId!)
        .neq("status", "cancelled")
        .order("registered_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useInvalidate(eventId: string) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["registration", eventId, userId] });
    qc.invalidateQueries({ queryKey: ["my-registrations", userId] });
    qc.invalidateQueries({ queryKey: ["events"] });
    qc.invalidateQueries({ queryKey: ["event", eventId] });
  };
}

export function useRegister(eventId: string) {
  const { userId } = useAuth();
  const invalidate = useInvalidate(eventId);
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not authenticated");
      // Upsert re-activates a previously cancelled registration in one round-trip.
      const { data, error } = await supabase
        .from("event_registrations")
        .upsert(
          {
            event_id: eventId,
            user_id: userId,
            status: "registered",
            cancelled_at: null,
          },
          { onConflict: "event_id,user_id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useCancelRegistration(eventId: string) {
  const { userId } = useAuth();
  const invalidate = useInvalidate(eventId);
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("event_registrations")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("event_id", eventId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useCheckIn(eventId: string) {
  const { userId } = useAuth();
  const invalidate = useInvalidate(eventId);
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("event_registrations")
        .update({ status: "checked_in", checked_in_at: new Date().toISOString() })
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .eq("status", "registered"); // only registered users can check in
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Admin / event-lead attendance roster for a single event. */
export function useEventAttendance(eventId: string) {
  return useQuery({
    queryKey: ["attendance", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*, profiles(full_name, avatar_url)")
        .eq("event_id", eventId)
        .neq("status", "cancelled")
        .order("checked_in_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
