import React, { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loading, Empty, ErrorState } from "@/components/ui/states";
import { useEventAttendance } from "@/hooks/useRegistration";
import { useEvent } from "@/hooks/useEvents";
import { fmtTime } from "@/utils/dates";

export default function Attendance() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: event } = useEvent(id);
  const { data, isLoading, isError, refetch } = useEventAttendance(id);

  const stats = useMemo(() => {
    const total = data?.length ?? 0;
    const checkedIn = (data ?? []).filter((r: any) => r.status === "checked_in").length;
    const rate = total ? Math.round((checkedIn / total) * 100) : 0;
    return { total, checkedIn, rate };
  }, [data]);

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={["top"]}>
      <View className="flex-row items-center px-4 py-2">
        <Button label="‹ Back" variant="ghost" onPress={() => router.back()} className="px-2 py-1" />
      </View>

      <View className="px-5">
        <Text className="text-xl font-extrabold text-forest">Attendance</Text>
        <Text className="mb-4 text-sm text-muted" numberOfLines={1}>{event?.title}</Text>

        <View className="mb-4 flex-row gap-3">
          <Card className="flex-1 items-center py-4">
            <Text className="text-3xl font-extrabold text-forest">{stats.checkedIn}</Text>
            <Text className="text-xs text-muted">Checked in</Text>
          </Card>
          <Card className="flex-1 items-center py-4">
            <Text className="text-3xl font-extrabold text-ink">{stats.total}</Text>
            <Text className="text-xs text-muted">Registered</Text>
          </Card>
          <Card className="flex-1 items-center py-4">
            <Text className="text-3xl font-extrabold text-sky">{stats.rate}%</Text>
            <Text className="text-xs text-muted">Turnout</Text>
          </Card>
        </View>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data?.length ? (
        <Empty title="No registrations yet" icon="👀" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(r: any) => r.id}
          contentContainerClassName="px-5 pb-10"
          renderItem={({ item }: any) => (
            <View className="mb-2 flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3">
              <Text className="flex-1 text-base text-ink">{item.profiles?.full_name ?? "Member"}</Text>
              {item.status === "checked_in" ? (
                <Text className="text-xs font-semibold text-forest">✓ {fmtTime(item.checked_in_at)}</Text>
              ) : (
                <Text className="text-xs text-muted">Registered</Text>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
