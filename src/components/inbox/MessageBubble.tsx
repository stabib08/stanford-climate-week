import React from "react";
import { Text, View } from "react-native";
import { cn } from "@/utils/cn";
import { fmtTime } from "@/utils/dates";

export function MessageBubble({
  body,
  mine,
  createdAt,
}: {
  body: string;
  mine: boolean;
  createdAt: string;
}) {
  return (
    <View className={cn("mb-2 max-w-[80%]", mine ? "self-end items-end" : "self-start items-start")}>
      <View
        className={cn(
          "rounded-3xl px-4 py-2.5",
          mine ? "bg-forest rounded-br-md" : "bg-white border border-gray-100 rounded-bl-md",
        )}
      >
        <Text className={cn("text-base", mine ? "text-white" : "text-ink")}>{body}</Text>
      </View>
      <Text className="mt-0.5 px-1 text-[10px] text-muted">{fmtTime(createdAt)}</Text>
    </View>
  );
}
