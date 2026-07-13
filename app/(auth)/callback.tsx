import React, { useEffect } from "react";
import { useLocalSearchParams, useRouter, useRootNavigationState } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Loading } from "@/components/ui/states";

/**
 * Deep-link return target for magic links and SSO.
 * Exchanges the `code` for a session; the root navigator then routes onward.
 */
export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    // A magic link opens the app straight at this route, so the root navigator
    // may not be mounted yet. Wait for it, or router.replace throws
    // "Attempted to navigate before mounting the Root Layout".
    if (!navState?.key) return;
    (async () => {
      if (params.code) {
        await supabase.auth.exchangeCodeForSession(params.code);
      }
      router.replace("/");
    })();
  }, [navState?.key, params.code]);

  return <Loading label="Signing you in…" />;
}
