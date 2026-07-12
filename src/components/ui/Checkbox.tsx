import React from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "@/utils/cn";

export function CheckboxRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      className="mb-2 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 py-3.5"
    >
      <View
        className={cn(
          "mr-3 h-6 w-6 items-center justify-center rounded-md border-2",
          checked ? "border-forest bg-forest" : "border-gray-300 bg-white",
        )}
      >
        {checked ? <Text className="text-sm font-bold text-white">✓</Text> : null}
      </View>
      <Text className="flex-1 text-base text-ink">{label}</Text>
    </Pressable>
  );
}
