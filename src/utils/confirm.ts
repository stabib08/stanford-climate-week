import { Alert, Platform } from "react-native";

/**
 * Cross-platform confirmation dialog.
 *
 * react-native's `Alert.alert` is a no-op on react-native-web, which silently
 * swallowed the confirm step for destructive actions whose mutation runs inside
 * the alert callback (e.g. cancelling a registration did nothing on web). On web
 * we fall back to the browser's `window.confirm`; on native we use the familiar
 * `Alert` with a destructive action.
 *
 * Resolves `true` when the user confirms, `false` otherwise.
 */
export function confirm({
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  destructive = false,
}: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}): Promise<boolean> {
  if (Platform.OS === "web") {
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(typeof window !== "undefined" && window.confirm(text));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}
