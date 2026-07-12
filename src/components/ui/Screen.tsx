import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn } from "@/utils/cn";

export function Screen({
  children,
  scroll = false,
  className,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
}) {
  const Body = (
    <View className={cn("flex-1 px-5", className)}>{children}</View>
  );
  return (
    <SafeAreaView className="flex-1 bg-sand" edges={["top"]}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className={className}>{children}</View>
        </ScrollView>
      ) : (
        Body
      )}
    </SafeAreaView>
  );
}
