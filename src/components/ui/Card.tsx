import React from "react";
import { Text, View } from "react-native";
import { cn } from "@/utils/cn";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "rounded-3xl border border-gray-100 bg-white p-4 shadow-sm",
        className,
      )}
    >
      {children}
    </View>
  );
}

export function Badge({ label, tone = "forest" }: { label: string; tone?: "forest" | "sky" | "sand" }) {
  const tones = {
    forest: "bg-forest-tint text-forest",
    sky: "bg-sky/10 text-sky",
    sand: "bg-gray-100 text-muted",
  } as const;
  return (
    <View className={cn("mr-1.5 mb-1.5 rounded-full px-2.5 py-1", tones[tone].split(" ")[0])}>
      <Text className={cn("text-xs font-medium", tones[tone].split(" ")[1])}>{label}</Text>
    </View>
  );
}
