import React from "react";
import { Text, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { CheckboxRow } from "@/components/ui/Checkbox";
import { profileSchema, type ProfileFormValues } from "@/schemas/profile";
import { useSaveProfile } from "@/hooks/useProfile";
import {
  INVOLVEMENT_OPTIONS,
  DEGREE_OPTIONS,
  STANFORD_YEARS,
  EXTERNAL_SECTOR_OPTIONS,
  CLIMATE_IDENTITY_OPTIONS,
  PAIN_POINT_OPTIONS,
} from "@/lib/constants";

export default function ProfileOnboarding() {
  const save = useSaveProfile();
  const { control, handleSubmit, watch, formState } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { involvement: [], climate_pain_point_other: "" },
    mode: "onTouched",
  });

  const isStanford = watch("is_stanford_student");
  const painPoint = watch("climate_pain_point");

  const onSubmit = handleSubmit((values) => save.mutate(values));

  return (
    <Screen scroll>
      <View className="mt-14 mb-6">
        <Text className="text-2xl font-extrabold text-forest">Welcome to SCW 🌍</Text>
        <Text className="mt-1 text-sm text-muted">
          Tell us a bit about you. This helps the Impact Team understand our community.
        </Text>
      </View>

      {/* Full name */}
      <Controller
        control={control}
        name="full_name"
        render={({ field, fieldState }) => (
          <Field label="Full name" required error={fieldState.error?.message}>
            <Input
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Jane Cardinal"
              hasError={!!fieldState.error}
            />
          </Field>
        )}
      />

      {/* Location */}
      <Controller
        control={control}
        name="location"
        render={({ field, fieldState }) => (
          <Field label="Where are you based?" required error={fieldState.error?.message}>
            <Input
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="City, State / Country"
              hasError={!!fieldState.error}
            />
          </Field>
        )}
      />

      {/* Involvement (multi) */}
      <Controller
        control={control}
        name="involvement"
        render={({ field, fieldState }) => (
          <Field label="Your involvement with SCW" required error={fieldState.error?.message}>
            {INVOLVEMENT_OPTIONS.map((opt) => (
              <CheckboxRow
                key={opt.value}
                label={opt.label}
                checked={field.value?.includes(opt.value)}
                onToggle={() =>
                  field.onChange(
                    field.value?.includes(opt.value)
                      ? field.value.filter((v) => v !== opt.value)
                      : [...(field.value ?? []), opt.value],
                  )
                }
              />
            ))}
          </Field>
        )}
      />

      {/* Stanford student? */}
      <Controller
        control={control}
        name="is_stanford_student"
        render={({ field, fieldState }) => (
          <Field label="Are you a Stanford student?" required error={fieldState.error?.message}>
            <Select
              value={field.value === undefined ? undefined : field.value ? "yes" : "no"}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              onChange={(v) => field.onChange(v === "yes")}
              hasError={!!fieldState.error}
            />
          </Field>
        )}
      />

      {/* Conditional: Stanford branch */}
      {isStanford === true ? (
        <View className="rounded-3xl bg-forest-tint p-4">
          <Controller
            control={control}
            name="degree"
            render={({ field, fieldState }) => (
              <Field label="Degree" required error={fieldState.error?.message}>
                <Select value={field.value} options={DEGREE_OPTIONS} onChange={field.onChange} hasError={!!fieldState.error} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="stanford_year"
            render={({ field, fieldState }) => (
              <Field label="Year at Stanford" required error={fieldState.error?.message}>
                <Select
                  value={field.value}
                  options={STANFORD_YEARS.map((y) => ({ value: y, label: String(y) }))}
                  onChange={field.onChange}
                  hasError={!!fieldState.error}
                />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="area_of_study"
            render={({ field, fieldState }) => (
              <Field label="Area of study" required error={fieldState.error?.message}>
                <Input value={field.value} onChangeText={field.onChange} placeholder="e.g. Energy Science & Engineering" hasError={!!fieldState.error} />
              </Field>
            )}
          />
        </View>
      ) : null}

      {/* Conditional: External branch */}
      {isStanford === false ? (
        <View className="rounded-3xl bg-forest-tint p-4">
          <Controller
            control={control}
            name="external_sector"
            render={({ field, fieldState }) => (
              <Field label="Which best describes you?" required error={fieldState.error?.message}>
                <Select value={field.value} options={EXTERNAL_SECTOR_OPTIONS} onChange={field.onChange} hasError={!!fieldState.error} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="background_affiliation"
            render={({ field, fieldState }) => (
              <Field label="What is your background / affiliation?" required error={fieldState.error?.message}>
                <Input value={field.value} onChangeText={field.onChange} placeholder="Company, role, or focus area" multiline hasError={!!fieldState.error} />
              </Field>
            )}
          />
        </View>
      ) : null}

      <View className="h-4" />

      {/* Climate identity */}
      <Controller
        control={control}
        name="climate_identity"
        render={({ field, fieldState }) => (
          <Field label="Which do you identify with most?" required error={fieldState.error?.message}>
            <Select value={field.value} options={CLIMATE_IDENTITY_OPTIONS} onChange={field.onChange} hasError={!!fieldState.error} />
          </Field>
        )}
      />

      {/* Pain point */}
      <Controller
        control={control}
        name="climate_pain_point"
        render={({ field, fieldState }) => (
          <Field label="Your greatest climate pain point?" required error={fieldState.error?.message}>
            <Select value={field.value} options={PAIN_POINT_OPTIONS} onChange={field.onChange} hasError={!!fieldState.error} />
          </Field>
        )}
      />

      {painPoint === "other" ? (
        <Controller
          control={control}
          name="climate_pain_point_other"
          render={({ field, fieldState }) => (
            <Field label="Tell us more" required error={fieldState.error?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="Describe your pain point" multiline hasError={!!fieldState.error} />
            </Field>
          )}
        />
      ) : null}

      {save.isError ? (
        <Text className="mb-3 text-sm text-cardinal">
          Couldn't save your profile. Please check your connection and try again.
        </Text>
      ) : null}

      <Button
        label="Complete profile"
        onPress={onSubmit}
        loading={save.isPending}
        disabled={formState.isSubmitting}
        className="mt-2"
      />
      <View className="h-10" />
    </Screen>
  );
}
