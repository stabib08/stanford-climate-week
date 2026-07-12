import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { Tables } from "@/lib/database.types";
import type { PostEventSurveyValues } from "@/schemas/survey";

export type PostEventSurvey = Tables<"post_event_surveys">;

/** Whether the user has already submitted the post-event survey. */
export function usePostEventSurvey(eventId: string) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["post-event-survey", eventId, userId],
    enabled: !!userId && !!eventId,
    queryFn: async (): Promise<PostEventSurvey | null> => {
      const { data, error } = await supabase
        .from("post_event_surveys")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitPostEventSurvey(eventId: string) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: PostEventSurveyValues) => {
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("post_event_surveys")
        .upsert(
          {
            event_id: eventId,
            user_id: userId,
            learning_scale: values.learning_scale,
            most_helpful: values.most_helpful,
            other_thoughts: values.other_thoughts ?? null,
          },
          { onConflict: "event_id,user_id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post-event-survey", eventId, userId] });
    },
  });
}
