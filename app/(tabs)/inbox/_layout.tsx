import { Stack } from "expo-router";

export default function InboxStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[conversationId]" />
      <Stack.Screen name="new" options={{ presentation: "modal" }} />
      <Stack.Screen name="blast" options={{ presentation: "modal" }} />
    </Stack>
  );
}
