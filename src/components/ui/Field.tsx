import React from "react";
import { Text, View } from "react-native";

export function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-semibold text-ink">
        {label}
        {required ? <Text className="text-cardinal"> *</Text> : null}
      </Text>
      {children}
      {error ? (
        <Text className="mt-1 text-xs text-cardinal">{error}</Text>
      ) : null}
    </View>
  );
}
