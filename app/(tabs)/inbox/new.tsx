import React, { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Loading, Empty } from "@/components/ui/states";
import { useDirectory } from "@/hooks/useDirectory";
import { useStartConversation } from "@/hooks/useMessages";

export default function NewConversation() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useDirectory(search);
  const start = useStartConversation();
  const router = useRouter();

  const open = async (otherId: string) => {
    const convId = await start.mutateAsync(otherId);
    router.replace(`/(tabs)/inbox/${convId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-xl font-extrabold text-forest">New message</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-forest">Close</Text>
        </Pressable>
      </View>

      <View className="px-5 pb-3">
        <Input value={search} onChangeText={setSearch} placeholder="Search attendees by name" autoFocus />
      </View>

      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty title="No matches" subtitle="Try a different name." icon="🔎" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(p) => p.id!}
          contentContainerClassName="px-5 pb-10"
          renderItem={({ item }) => (
            <Pressable onPress={() => open(item.id!)} className="mb-1 flex-row items-center rounded-2xl bg-white px-4 py-3">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-forest-tint">
                <Text className="font-bold text-forest">
                  {(item.full_name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </Text>
              </View>
              <Text className="text-base text-ink">{item.full_name}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
