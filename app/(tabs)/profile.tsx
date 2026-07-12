import React from "react";
import { Text, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/states";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { INVOLVEMENT_OPTIONS, labelFor } from "@/lib/constants";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) return <Loading />;

  const involvementLabels = profile.involvement.map(
    (r) => INVOLVEMENT_OPTIONS.find((o) => o.value === r)?.label ?? r,
  );

  return (
    <Screen scroll>
      <View className="mb-6 mt-4 items-center">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-forest">
          <Text className="text-2xl font-bold text-white">
            {(profile.full_name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </Text>
        </View>
        <Text className="mt-3 text-xl font-bold text-ink">{profile.full_name}</Text>
        <Text className="text-sm text-muted">{profile.email}</Text>
        {profile.is_admin ? <Badge label="Impact Team" tone="sky" /> : null}
      </View>

      <Card className="mb-3">
        <Text className="mb-2 text-xs font-semibold uppercase text-muted">Involvement</Text>
        <View className="flex-row flex-wrap">
          {involvementLabels.map((l) => (
            <Badge key={l} label={l} tone="forest" />
          ))}
        </View>
      </Card>

      <Card className="mb-3">
        <Text className="mb-2 text-xs font-semibold uppercase text-muted">Based in</Text>
        <Text className="text-base text-ink">{profile.location}</Text>
      </Card>

      <Card className="mb-3">
        <Text className="mb-2 text-xs font-semibold uppercase text-muted">Affiliation</Text>
        <Text className="text-base text-ink">
          {profile.is_stanford_student
            ? `Stanford · ${labelFor(profile.degree ?? "")} · Class of ${profile.stanford_year} · ${profile.area_of_study}`
            : profile.background_affiliation}
        </Text>
      </Card>

      <Button label="Sign out" variant="outline" className="mt-4" onPress={signOut} />
      <View className="h-10" />
    </Screen>
  );
}
