import React, { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { cn } from "@/utils/cn";

type Option<T> = { value: T; label: string };

export function Select<T extends string | number>({
  value,
  options,
  placeholder = "Select…",
  onChange,
  hasError,
}: {
  value: T | undefined;
  options: Option<T>[];
  placeholder?: string;
  onChange: (value: T) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className={cn(
          "flex-row items-center justify-between rounded-2xl border bg-white px-4 py-3.5",
          hasError ? "border-cardinal" : "border-gray-200",
        )}
      >
        <Text className={cn("text-base", selected ? "text-ink" : "text-gray-400")}>
          {selected?.label ?? placeholder}
        </Text>
        <Text className="text-gray-400">▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <View className="max-h-[60%] rounded-t-3xl bg-white p-4">
            <View className="mb-2 h-1 w-10 self-center rounded-full bg-gray-300" />
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className="flex-row items-center justify-between border-b border-gray-100 px-2 py-4"
                >
                  <Text className="text-base text-ink">{item.label}</Text>
                  {item.value === value ? (
                    <Text className="font-bold text-forest">✓</Text>
                  ) : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
