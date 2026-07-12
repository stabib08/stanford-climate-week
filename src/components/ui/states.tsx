import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button } from "./Button";

/** Full-screen loading state. */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-sand">
      <ActivityIndicator size="large" color="#0B3D2E" />
      <Text className="mt-3 text-sm text-muted">{label}</Text>
    </View>
  );
}

/** Empty state with an optional call-to-action. */
export function Empty({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon = "🌱",
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="mb-3 text-5xl">{icon}</Text>
      <Text className="text-center text-lg font-semibold text-ink">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 text-center text-sm text-muted">{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} className="mt-5" variant="outline" />
      ) : null}
    </View>
  );
}

/** Error state with retry. */
export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="mb-3 text-5xl">⚠️</Text>
      <Text className="text-center text-lg font-semibold text-ink">Unable to load</Text>
      <Text className="mt-1 text-center text-sm text-muted">{message}</Text>
      {onRetry ? (
        <Button label="Try again" onPress={onRetry} className="mt-5" variant="outline" />
      ) : null}
    </View>
  );
}
