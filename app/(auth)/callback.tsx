import React, { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Loading } from "@/components/ui/states";

/**
 * Deep-link return target for magic links and SSO.
 * Exchanges the `code` for a session; the root navigator then routes onward.
 */
export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (params.code) {
        await supabase.auth.exchangeCodeForSession(params.code);
      }
      router.replace("/");
    })();
  }, [params.code]);

  return <Loading label="Signing you in…" />;
}
