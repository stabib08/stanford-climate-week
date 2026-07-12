import React, { useState } from "react";
import { Text, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { supabase } from "@/lib/supabase";
import { emailSchema, isStanfordEmail, type EmailFormValues } from "@/schemas/profile";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, watch, formState } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const email = watch("email");
  const stanford = isStanfordEmail(email);
  const redirectTo = Linking.createURL("/(auth)/callback");

  // ---- Magic link (passwordless email) ----
  const sendMagicLink = handleSubmit(async ({ email }) => {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  });

  // ---- Stanford SSO (SAML) ----
  const signInWithStanford = async () => {
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithSSO({
      domain: "stanford.edu",
      options: { redirectTo },
    });
    if (error || !data?.url) {
      setBusy(false);
      // When SAML SSO isn't enabled on the project, the auth server returns
      // "SAML 2.0 is disabled" (or the SSO endpoint 404s). Don't show that raw
      // message — point the user at the magic-link fallback, which always works.
      const raw = error?.message ?? "";
      const ssoUnavailable =
        !data?.url || /saml|sso|disabled|not.*enabled|404|not found/i.test(raw);
      setError(
        ssoUnavailable
          ? "Stanford SSO isn't available yet. Use “Email me a link instead” below to sign in with your Stanford email."
          : raw,
      );
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    setBusy(false);
    if (result.type === "success" && result.url) {
      const { params } = Linking.parse(result.url);
      // The callback route exchanges the code; nothing else needed here.
    }
  };

  if (sent) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Text className="mb-3 text-5xl">📬</Text>
          <Text className="text-center text-xl font-bold text-ink">Check your email</Text>
          <Text className="mt-2 text-center text-sm text-muted">
            We sent a sign-in link to {email}. Tap it on this device to continue.
          </Text>
          <Button label="Use a different email" variant="ghost" className="mt-6" onPress={() => setSent(false)} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className="mt-16 mb-8">
        <Text className="text-3xl font-extrabold text-forest">Stanford{"\n"}Climate Week</Text>
        <Text className="mt-2 text-base text-muted">
          Oct 19–25, 2026 · Sign in to view the agenda, register, and connect.
        </Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur }, fieldState }) => (
          <Field label="Email" required error={fieldState.error?.message}>
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="you@stanford.edu or personal email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
              hasError={!!fieldState.error}
            />
          </Field>
        )}
      />

      {error ? <Text className="mb-3 text-sm text-cardinal">{error}</Text> : null}

      {stanford ? (
        <Button label="Continue with Stanford SSO" onPress={signInWithStanford} loading={busy} />
      ) : (
        <Button
          label="Email me a sign-in link"
          onPress={sendMagicLink}
          loading={busy}
          disabled={!formState.isValid}
        />
      )}

      <View className="my-5 flex-row items-center">
        <View className="h-px flex-1 bg-gray-200" />
        <Text className="mx-3 text-xs text-muted">or</Text>
        <View className="h-px flex-1 bg-gray-200" />
      </View>

      {stanford ? (
        <Button label="Email me a link instead" variant="outline" onPress={sendMagicLink} loading={busy} />
      ) : (
        <Button label="Use Stanford SSO" variant="outline" onPress={signInWithStanford} loading={busy} />
      )}

      <Text className="mt-6 text-center text-xs text-muted">
        By continuing you agree to the SCW community guidelines. Your data is protected
        by row-level security and only visible to you and the SCW Impact Team.
      </Text>
    </Screen>
  );
}
