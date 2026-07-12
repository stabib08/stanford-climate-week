import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { Tables, Enums } from "@/lib/database.types";
import type { BlastValues } from "@/schemas/message";

export type InboxItem =
  | {
      kind: "conversation";
      id: string;
      title: string;
      preview: string;
      timestamp: string;
      otherId: string | null;
    }
  | {
      kind: "blast";
      id: string;
      title: string;
      preview: string;
      timestamp: string;
      audience: Enums<"blast_audience">;
    };

/**
 * Unified inbox: 1-on-1 conversations + broadcast blasts the user can see,
 * merged and sorted by recency. Blasts are NOT fanned out per-recipient —
 * RLS decides visibility, so this scales to thousands of attendees.
 */
export function useInbox() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["inbox", userId],
    enabled: !!userId,
    queryFn: async (): Promise<InboxItem[]> => {
      const [{ data: convs }, { data: blasts }] = await Promise.all([
        supabase
          .from("conversations")
          .select(
            "id, last_message_at, conversation_participants(user_id, directory_profiles(full_name)), messages(body, created_at)",
          )
          .order("last_message_at", { ascending: false }),
        supabase
          .from("blasts")
          .select("id, subject, body, audience, created_at, sender_id")
          .order("created_at", { ascending: false }),
      ]);

      const conversationItems: InboxItem[] = (convs ?? []).map((c: any) => {
        const other = (c.conversation_participants ?? []).find(
          (p: any) => p.user_id !== userId,
        );
        const lastMsg = (c.messages ?? [])
          .slice()
          .sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1))[0];
        return {
          kind: "conversation",
          id: c.id,
          title: other?.directory_profiles?.full_name ?? "Stanford Climate Week member",
          preview: lastMsg?.body ?? "Say hello 👋",
          timestamp: c.last_message_at,
          otherId: other?.user_id ?? null,
        };
      });

      const blastItems: InboxItem[] = (blasts ?? []).map((b: any) => ({
        kind: "blast",
        id: b.id,
        title: b.subject ?? "Announcement",
        preview: b.body,
        timestamp: b.created_at,
        audience: b.audience,
      }));

      return [...conversationItems, ...blastItems].sort((a, b) =>
        a.timestamp < b.timestamp ? 1 : -1,
      );
    },
  });
}

export type BlastRow = Tables<"blasts">;

export function useSendBlast() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: BlastValues) => {
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("blasts")
        .insert({
          sender_id: userId,
          audience: values.audience,
          event_id: values.audience === "event_registrants" ? values.event_id! : null,
          subject: values.subject ?? null,
          body: values.body,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox", userId] });
    },
  });
}
