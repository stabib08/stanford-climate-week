import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { Loading, Empty, ErrorState } from "@/components/ui/states";
import { useInbox, type InboxItem } from "@/hooks/useInbox";
import { useRoles } from "@/hooks/useProfile";
import { formatDistanceToNowStrict, parseISO } from "date-fns";

export default function Inbox() {
  const { data, isLoading, isError, refetch } = useInbox();
  const { isOrganizer, isEventLead } = useRoles();
  const router = useRouter();
  const canBlast = isOrganizer || isEventLead;

  const renderItem = ({ item }: { item: InboxItem }) => {
    const time = formatDistanceToNowStrict(parseISO(item.timestamp), { addSuffix: true });
    const isBlast = item.kind === "blast";
    return (
      <Pressable
        onPress={() =>
          item.kind === "conversation"
            ? router.push(`/(tabs)/inbox/${item.id}`)
            : undefined
        }
        className="mb-1 flex-row items-center rounded-2xl bg-white px-4 py-3"
      >
        <View className={`mr-3 h-12 w-12 items-center justify-center rounded-full ${isBlast ? "bg-cardinal/10" : "bg-forest-tint"}`}>
          <Text className="text-lg">{isBlast ? "📣" : "💬"}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-ink" numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="ml-2 text-[11px] text-muted">{time}</Text>
          </View>
          <Text className="text-sm text-muted" numberOfLines={1}>
            {isBlast ? "📣 " : ""}
            {item.preview}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen>
      <View className="mb-3 mt-2 flex-row items-center justify-between">
        <Text className="text-2xl font-extrabold text-forest">Inbox</Text>
        <View className="flex-row gap-2">
          {canBlast ? (
            <Button label="📣 Blast" variant="outline" className="px-3 py-2" onPress={() => router.push("/(tabs)/inbox/blast")} />
          ) : null}
          <Button label="+ New" className="px-3 py-2" onPress={() => router.push("/(tabs)/inbox/new")} />
        </View>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data?.length ? (
        <Empty
          title="No messages yet"
          subtitle="Start a conversation with someone in the SCW community."
          icon="💬"
          actionLabel="New message"
          onAction={() => router.push("/(tabs)/inbox/new")}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => `${i.kind}:${i.id}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-6"
        />
      )}
    </Screen>
  );
}
