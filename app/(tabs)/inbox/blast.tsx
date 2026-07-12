import React from "react";
import { Alert, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { blastSchema, type BlastValues } from "@/schemas/message";
import { useSendBlast } from "@/hooks/useInbox";
import { useRoles } from "@/hooks/useProfile";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabase";

/** Events the current user is allowed to blast (organizers: all; leads: their events). */
function useBlastableEvents() {
  const { userId } = useAuth();
  const { isOrganizer } = useRoles();
  return useQuery({
    queryKey: ["blastable-events", userId, isOrganizer],
    enabled: !!userId,
    queryFn: async () => {
      if (isOrganizer) {
        const { data } = await supabase.from("events").select("id, title").order("starts_at");
        return data ?? [];
      }
      const { data } = await supabase
        .from("event_leads")
        .select("events(id, title)")
        .eq("user_id", userId!);
      return (data ?? []).map((r: any) => r.events).filter(Boolean);
    },
  });
}

export default function BlastComposer() {
  const router = useRouter();
  const { isOrganizer } = useRoles();
  const send = useSendBlast();
  const { data: events } = useBlastableEvents();

  const { control, handleSubmit, watch } = useForm<BlastValues>({
    resolver: zodResolver(blastSchema),
    defaultValues: {
      audience: isOrganizer ? "all_attendees" : "event_registrants",
      body: "",
    },
  });
  const audience = watch("audience");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await send.mutateAsync(values);
      Alert.alert("Blast sent 📣", "Your announcement is now in recipients' inboxes.");
      router.back();
    } catch (e: any) {
      Alert.alert("Couldn't send", e?.message ?? "You may not have permission for this audience.");
    }
  });

  const audienceOptions = isOrganizer
    ? [
        { value: "all_attendees" as const, label: "All attendees" },
        { value: "event_registrants" as const, label: "Registrants of an event" },
      ]
    : [{ value: "event_registrants" as const, label: "Registrants of my event" }];

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-xl font-extrabold text-forest">Send a blast 📣</Text>
        <Button label="Close" variant="ghost" className="px-2 py-1" onPress={() => router.back()} />
      </View>

      <View className="px-5">
        <Controller
          control={control}
          name="audience"
          render={({ field }) => (
            <Field label="Audience" required>
              <Select value={field.value} options={audienceOptions} onChange={field.onChange} />
            </Field>
          )}
        />

        {audience === "event_registrants" ? (
          <Controller
            control={control}
            name="event_id"
            render={({ field, fieldState }) => (
              <Field label="Which event?" required error={fieldState.error?.message}>
                <Select
                  value={field.value}
                  options={(events ?? []).map((e: any) => ({ value: e.id, label: e.title }))}
                  onChange={field.onChange}
                  placeholder="Select an event"
                  hasError={!!fieldState.error}
                />
              </Field>
            )}
          />
        ) : null}

        <Controller
          control={control}
          name="subject"
          render={({ field }) => (
            <Field label="Subject (optional)">
              <Input value={field.value} onChangeText={field.onChange} placeholder="e.g. Welcome to SCW!" />
            </Field>
          )}
        />

        <Controller
          control={control}
          name="body"
          render={({ field, fieldState }) => (
            <Field label="Message" required error={fieldState.error?.message}>
              <Input
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Type your announcement…"
                multiline
                className="h-32"
                style={{ textAlignVertical: "top" }}
                hasError={!!fieldState.error}
              />
            </Field>
          )}
        />

        <Button label="Send blast" onPress={onSubmit} loading={send.isPending} className="mt-2" />
      </View>
    </SafeAreaView>
  );
}
