import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card, Badge } from "@/components/ui/Card";
import { Loading, Empty, ErrorState } from "@/components/ui/states";
import { useMyRegistrations } from "@/hooks/useRegistration";
import { fmtRange } from "@/utils/dates";
import { parseISO } from "date-fns";

export default function MyEvents() {
  const { data, isLoading, isError, refetch } = useMyRegistrations();
  const router = useRouter();

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <Screen>
      <Text className="mb-3 mt-2 text-2xl font-extrabold text-forest">My Events</Text>
      {!data?.length ? (
        <Empty
          title="No registrations yet"
          subtitle="Register for sessions and they'll show up here."
          icon="🎟️"
          actionLabel="Browse the agenda"
          onAction={() => router.push("/(tabs)/events")}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(r: any) => r.id}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-6"
          renderItem={({ item }: any) => {
            const event = item.events;
            const ended = parseISO(event.ends_at) < new Date();
            const checkedIn = item.status === "checked_in";
            return (
              <Pressable onPress={() => router.push(`/(tabs)/events/${event.id}`)} className="mb-3">
                <Card>
                  <View className="flex-row items-start justify-between">
                    <Text className="flex-1 pr-2 text-base font-bold text-ink">{event.title}</Text>
                    {checkedIn ? <Badge label="Checked in" tone="forest" /> : <Badge label="Registered" tone="sky" />}
                  </View>
                  <Text className="mt-1 text-xs text-muted">{fmtRange(event.starts_at, event.ends_at)}</Text>
                  <Text className="text-xs text-muted">📍 {event.location}</Text>

                  {ended && checkedIn ? (
                    <Pressable
                      onPress={() => router.push(`/survey/event/${event.id}`)}
                      className="mt-3 items-center rounded-2xl bg-forest py-2.5"
                    >
                      <Text className="text-sm font-semibold text-white">Share post-event feedback →</Text>
                    </Pressable>
                  ) : null}
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
