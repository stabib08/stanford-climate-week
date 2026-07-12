import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { Tables, TablesInsert } from "@/lib/database.types";
import type { ProfileFormValues } from "@/schemas/profile";

export type Profile = Tables<"profiles">;

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function useProfile() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: () => fetchProfile(userId!),
  });
}

/** Convenience role checks derived from the current profile. */
export function useRoles() {
  const { data } = useProfile();
  const involvement = data?.involvement ?? [];
  return {
    isOrganizer: involvement.includes("organizer"),
    isEventLead: involvement.includes("event_lead"),
    isAdmin: data?.is_admin ?? false,
    onboardingCompleted: data?.onboarding_completed ?? false,
  };
}

export function useSaveProfile() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!userId) throw new Error("Not authenticated");
      const payload: TablesInsert<"profiles"> = {
        id: userId,
        full_name: values.full_name,
        location: values.location,
        involvement: values.involvement,
        is_stanford_student: values.is_stanford_student,
        degree: values.is_stanford_student ? values.degree : null,
        stanford_year: values.is_stanford_student ? values.stanford_year : null,
        area_of_study: values.is_stanford_student ? values.area_of_study : null,
        external_sector: values.is_stanford_student ? null : values.external_sector,
        background_affiliation: values.is_stanford_student
          ? null
          : values.background_affiliation,
        climate_identity: values.climate_identity,
        climate_pain_point: values.climate_pain_point,
        climate_pain_point_other:
          values.climate_pain_point === "other"
            ? values.climate_pain_point_other
            : null,
        onboarding_completed: true,
      };
      // Upsert: the row already exists (created by the handle_new_user trigger).
      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(["profile", userId], data);
    },
  });
}
