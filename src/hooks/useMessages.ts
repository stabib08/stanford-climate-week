import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { Tables } from "@/lib/database.types";

export type Message = Tables<"messages">;

/** Messages in a conversation, with a realtime subscription for live updates. */
export function useMessages(conversationId: string) {
  const qc = useQueryClient();
  const key = ["messages", conversationId];

  const query = useQuery({
    queryKey: key,
    enabled: !!conversationId,
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          qc.setQueryData<Message[]>(key, (prev = []) => {
            const next = payload.new as Message;
            if (prev.some((m) => m.id === next.id)) return prev;
            return [...prev, next];
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return query;
}

export function useSendMessage(conversationId: string) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: userId, body })
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

/**
 * Find an existing 1-on-1 conversation with `otherId`, or create one.
 * Returns the conversation id.
 */
export function useStartConversation() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (otherId: string): Promise<string> => {
      if (!userId) throw new Error("Not authenticated");

      // Look for a conversation both users already share.
      const { data: mine, error: mineErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);
      if (mineErr) throw mineErr;

      const myConvIds = (mine ?? []).map((r) => r.conversation_id);
      if (myConvIds.length) {
        const { data: shared } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", otherId)
          .in("conversation_id", myConvIds)
          .limit(1);
        if (shared?.length) return shared[0].conversation_id;
      }

      // None found — create a new conversation and add both participants.
      const { data: conv, error: convErr } = await supabase
        .from("conversations")
        .insert({ created_by: userId })
        .select()
        .single();
      if (convErr) throw convErr;

      const { error: partErr } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: conv.id, user_id: userId },
          { conversation_id: conv.id, user_id: otherId },
        ]);
      if (partErr) throw partErr;
      return conv.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox", userId] });
    },
  });
}
