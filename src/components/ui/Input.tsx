import React from "react";
import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/utils/cn";

export function Input({
  hasError,
  className,
  ...props
}: TextInputProps & { hasError?: boolean }) {
  return (
    <TextInput
      placeholderTextColor="#9CA3AF"
      className={cn(
        "rounded-2xl border bg-white px-4 py-3.5 text-base text-ink",
        hasError ? "border-cardinal" : "border-gray-200",
        className,
      )}
      {...props}
    />
  );
}
