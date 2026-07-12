import "../global.css";
import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { useProfile } from "@/hooks/useProfile";
import { Loading } from "@/components/ui/states";

/**
 * Central navigation gate:
 *  - no session            -> (auth)
 *  - session, no profile   -> (onboarding)
 *  - session + onboarded   -> (tabs)
 */
function RootNavigator() {
  const { session, initializing } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const segments = useSegments();
  const router = useRouter();

  const onboarded = profile?.onboarding_completed ?? false;

  useEffect(() => {
    if (initializing) return;
    if (session && profileLoading) return; // wait for profile before routing

    const group = segments[0];
    const inAuth = group === "(auth)";
    const inOnboarding = group === "(onboarding)";

    if (!session && !inAuth) {
      router.replace("/(auth)/sign-in");
    } else if (session && !onboarded && !inOnboarding) {
      router.replace("/(onboarding)/profile");
    } else if (session && onboarded && (inAuth || inOnboarding)) {
      router.replace("/(tabs)/events");
    }
  }, [session, initializing, profileLoading, onboarded, segments, router]);

  if (initializing || (session && profileLoading)) {
    return <Loading label="Warming up…" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="survey" options={{ presentation: "modal" }} />
      <Stack.Screen name="admin" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
