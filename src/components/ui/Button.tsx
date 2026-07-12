import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";

const base = "flex-row items-center justify-center rounded-2xl px-5 py-3.5";
const variants: Record<Variant, string> = {
  primary: "bg-forest active:bg-forest-light",
  secondary: "bg-sky active:opacity-90",
  outline: "border border-forest bg-transparent active:bg-forest-tint",
  danger: "bg-cardinal active:opacity-90",
  ghost: "bg-transparent active:bg-forest-tint",
};
const textColor: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-forest",
  danger: "text-white",
  ghost: "text-forest",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  className,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      className={cn(base, variants[variant], isDisabled && "opacity-50", className)}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" || variant === "ghost" ? "#0B3D2E" : "#fff"} />
      ) : (
        <Text className={cn("text-base font-semibold", textColor[variant])}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
