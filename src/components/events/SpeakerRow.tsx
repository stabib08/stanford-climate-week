import React from "react";
import { Text, View } from "react-native";
import type { EventSpeaker } from "@/hooks/useEvents";

export function SpeakerRow({ speaker }: { speaker: EventSpeaker }) {
  const initials = speaker.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <View className="mb-3 flex-row items-center">
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-forest-tint">
        <Text className="font-bold text-forest">{initials}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-ink">{speaker.name}</Text>
        {speaker.role ? (
          <Text className="text-xs text-muted">{speaker.role}</Text>
        ) : null}
      </View>
    </View>
  );
}
