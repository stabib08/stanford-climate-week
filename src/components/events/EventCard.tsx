import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Card, Badge } from "@/components/ui/Card";
import { fmtRange } from "@/utils/dates";
import { labelFor } from "@/lib/constants";
import type { EventWithCount } from "@/hooks/useEvents";

export function EventCard({
  event,
  onPress,
}: {
  event: EventWithCount;
  onPress: () => void;
}) {
  const tags = [...event.format_tags, ...event.sector_tags].slice(0, 4);
  return (
    <Pressable onPress={onPress} className="mb-3">
      <Card className="p-0 overflow-hidden">
        {event.cover_art_url ? (
          <Image
            source={{ uri: event.cover_art_url }}
            style={{ width: "100%", height: 140 }}
            contentFit="cover"
            transition={200}
          />
        ) : null}
        <View className="p-4">
          <Text className="text-base font-bold text-ink" numberOfLines={2}>
            {event.title}
          </Text>
          <Text className="mt-1 text-xs text-muted">
            {fmtRange(event.starts_at, event.ends_at)}
          </Text>
          <Text className="text-xs text-muted">📍 {event.location}</Text>

          <View className="mt-3 flex-row flex-wrap">
            {tags.map((t) => (
              <Badge key={t} label={labelFor(t)} tone="forest" />
            ))}
          </View>

          <Text className="mt-2 text-xs font-medium text-forest-light">
            {event.registered_count} registered
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
