import React, { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { SpeakerRow } from "@/components/events/SpeakerRow";
import { Loading, ErrorState } from "@/components/ui/states";
import { useEvent } from "@/hooks/useEvents";
import {
  useMyRegistration,
  useRegister,
  useCancelRegistration,
  useCheckIn,
} from "@/hooks/useRegistration";
import { useRoles } from "@/hooks/useProfile";
import { fmtRange, isWithinCheckInWindow } from "@/utils/dates";
import { addEventToCalendar } from "@/utils/calendar";
import { labelFor } from "@/lib/constants";

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: event, isLoading, isError, refetch } = useEvent(id);
  const { data: registration } = useMyRegistration(id);
  const { isOrganizer, isAdmin } = useRoles();

  const register = useRegister(id);
  const cancel = useCancelRegistration(id);
  const checkIn = useCheckIn(id);
  const [addingCal, setAddingCal] = useState(false);

  if (isLoading) return <Loading />;
  if (isError || !event) return <ErrorState onRetry={refetch} />;

  const status = registration?.status;
  const isRegistered = status === "registered" || status === "checked_in";
  const isCheckedIn = status === "checked_in";
  const canCheckIn =
    status === "registered" &&
    isWithinCheckInWindow(event.starts_at, event.ends_at);

  const handleRegister = async () => {
    try {
      await register.mutateAsync();
      Alert.alert(
        "You're registered! 🎉",
        "Add this to your calendar so you don't miss it?",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Add to calendar",
            onPress: async () => {
              setAddingCal(true);
              const ok = await addEventToCalendar(event);
              setAddingCal(false);
              if (!ok) Alert.alert("Calendar access needed", "Enable calendar permissions to add events.");
            },
          },
        ],
      );
    } catch {
      Alert.alert("Registration failed", "Please check your connection and try again.");
    }
  };

  const handleCancel = () => {
    Alert.alert("Cancel registration?", "You can re-register anytime while spots remain.", [
      { text: "Keep it", style: "cancel" },
      { text: "Cancel registration", style: "destructive", onPress: () => cancel.mutate() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={["top"]}>
      <View className="flex-row items-center px-4 py-2">
        <Button label="‹ Back" variant="ghost" onPress={() => router.back()} className="px-2 py-1" />
      </View>

      <ScrollView contentContainerClassName="px-5 pb-40" showsVerticalScrollIndicator={false}>
        {event.cover_art_url ? (
          <Image source={{ uri: event.cover_art_url }} style={{ width: "100%", height: 180, borderRadius: 24 }} contentFit="cover" />
        ) : null}

        <Text className="mt-4 text-2xl font-extrabold text-ink">{event.title}</Text>
        <Text className="mt-2 text-sm text-muted">🕑 {fmtRange(event.starts_at, event.ends_at)}</Text>
        <Text className="mt-1 text-sm text-muted">📍 {event.location}</Text>
        <Text className="mt-1 text-sm font-medium text-forest-light">
          {event.registered_count} registered · {event.checked_in_count} checked in
        </Text>

        <View className="mt-3 flex-row flex-wrap">
          {[...event.format_tags, ...event.sector_tags].map((t) => (
            <Badge key={t} label={labelFor(t)} tone="forest" />
          ))}
        </View>

        {event.description ? (
          <Text className="mt-4 text-base leading-6 text-ink">{event.description}</Text>
        ) : null}

        {event.event_speakers?.length ? (
          <View className="mt-6">
            <Text className="mb-3 text-lg font-bold text-ink">Speakers</Text>
            {[...event.event_speakers]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((s) => (
                <SpeakerRow key={s.id} speaker={s} />
              ))}
          </View>
        ) : null}

        {(isOrganizer || isAdmin) && (
          <Button
            label="View attendance (admin)"
            variant="outline"
            className="mt-6"
            onPress={() => router.push(`/admin/event/${id}/attendance`)}
          />
        )}
      </ScrollView>

      {/* Sticky action bar */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-3">
        {isCheckedIn ? (
          <View className="items-center rounded-2xl bg-forest-tint py-3">
            <Text className="font-semibold text-forest">✓ Checked in — enjoy the session!</Text>
          </View>
        ) : canCheckIn ? (
          <Button label="Check in now" onPress={() => checkIn.mutate()} loading={checkIn.isPending} />
        ) : isRegistered ? (
          <View className="flex-row gap-3">
            <Button label="Add to calendar" variant="outline" className="flex-1" loading={addingCal} onPress={async () => { setAddingCal(true); await addEventToCalendar(event); setAddingCal(false); }} />
            <Button label="Cancel" variant="danger" className="flex-1" onPress={handleCancel} loading={cancel.isPending} />
          </View>
        ) : (
          <Button label="Register" onPress={handleRegister} loading={register.isPending} />
        )}
      </View>
    </SafeAreaView>
  );
}
