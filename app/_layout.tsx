import "../global.css";
import React, { useEffect } from "react";
import { View } from "react-native";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
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
  const navState = useRootNavigationState();

  const onboarded = profile?.onboarding_completed ?? false;
  const booting = initializing || (session && profileLoading);

  useEffect(() => {
    if (!navState?.key) return; // root navigator not mounted yet
    if (booting) return; // wait for auth + profile before routing

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
  }, [navState?.key, booting, session, onboarded, segments, router]);

  // Always render the navigator so the Root Layout mounts on the first render.
  // Show the loading state as an overlay instead of unmounting the Stack —
  // unmounting it caused "Attempted to navigate before mounting the Root Layout".
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="survey" options={{ presentation: "modal" }} />
        <Stack.Screen name="admin" />
      </Stack>
      {booting ? (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <Loading label="Warming up…" />
        </View>
      ) : null}
    </View>
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
