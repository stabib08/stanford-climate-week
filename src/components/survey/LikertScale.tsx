import React from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "@/utils/cn";

/** 1–5 warm/cold agreement scale. */
export function LikertScale({
  value,
  onChange,
  lowLabel = "Strongly disagree",
  highLabel = "Strongly agree",
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  lowLabel?: string;
  highLabel?: string;
}) {
  return (
    <View>
      <View className="flex-row justify-between">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(n)}
              className={cn(
                "h-14 w-14 items-center justify-center rounded-2xl border-2",
                active ? "border-forest bg-forest" : "border-gray-200 bg-white",
              )}
            >
              <Text className={cn("text-lg font-bold", active ? "text-white" : "text-ink")}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View className="mt-1.5 flex-row justify-between">
        <Text className="text-xs text-muted">{lowLabel}</Text>
        <Text className="text-xs text-muted">{highLabel}</Text>
      </View>
    </View>
  );
}
