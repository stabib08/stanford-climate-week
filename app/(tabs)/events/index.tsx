import React, { useMemo, useState } from "react";
import { FlatList, Pressable, SectionList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { EventCard } from "@/components/events/EventCard";
import { Loading, Empty, ErrorState } from "@/components/ui/states";
import { useEvents, type EventWithCount } from "@/hooks/useEvents";
import { cn } from "@/utils/cn";
import { fmtDay } from "@/utils/dates";
import { parseISO, format } from "date-fns";

type ViewMode = "list" | "calendar";

export default function EventsFeed() {
  const { data, isLoading, isError, refetch } = useEvents();
  const [mode, setMode] = useState<ViewMode>("list");
  const router = useRouter();

  const sections = useMemo(() => {
    const byDay = new Map<string, EventWithCount[]>();
    (data ?? []).forEach((e) => {
      const key = format(parseISO(e.starts_at), "yyyy-MM-dd");
      byDay.set(key, [...(byDay.get(key) ?? []), e]);
    });
    return [...byDay.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([day, events]) => ({ title: fmtDay(events[0].starts_at), day, data: events }));
  }, [data]);

  const open = (id: string) => router.push(`/(tabs)/events/${id}`);

  if (isLoading) return <Loading label="Loading the agenda…" />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <Screen>
      <View className="mb-3 mt-2 flex-row items-center justify-between">
        <Text className="text-2xl font-extrabold text-forest">Agenda</Text>
        <View className="flex-row rounded-full bg-white p-1">
          {(["list", "calendar"] as ViewMode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              className={cn("rounded-full px-4 py-1.5", mode === m ? "bg-forest" : "bg-transparent")}
            >
              <Text className={cn("text-xs font-semibold", mode === m ? "text-white" : "text-muted")}>
                {m === "list" ? "List" : "By day"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {!data?.length ? (
        <Empty title="No events yet" subtitle="The SCW agenda will appear here soon." icon="📅" />
      ) : mode === "list" ? (
        <FlatList
          data={data}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => <EventCard event={item} onPress={() => open(item.id)} />}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-6"
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(e) => e.id}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View className="bg-sand py-2">
              <Text className="text-sm font-bold uppercase tracking-wide text-forest-light">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => <EventCard event={item} onPress={() => open(item.id)} />}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-6"
        />
      )}
    </Screen>
  );
}
