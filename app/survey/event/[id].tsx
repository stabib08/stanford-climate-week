import React from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { CheckboxRow } from "@/components/ui/Checkbox";
import { LikertScale } from "@/components/survey/LikertScale";
import { Loading } from "@/components/ui/states";
import { useEvent } from "@/hooks/useEvents";
import { usePostEventSurvey, useSubmitPostEventSurvey } from "@/hooks/useSurvey";
import { postEventSurveySchema, type PostEventSurveyValues } from "@/schemas/survey";
import { SURVEY_CATEGORY_OPTIONS } from "@/lib/constants";

export default function PostEventSurvey() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: event } = useEvent(id);
  const { data: existing, isLoading } = usePostEventSurvey(id);
  const submit = useSubmitPostEventSurvey(id);

  const { control, handleSubmit } = useForm<PostEventSurveyValues>({
    resolver: zodResolver(postEventSurveySchema),
    defaultValues: { other_thoughts: "" },
  });

  if (isLoading) return <Loading />;

  if (existing) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Text className="mb-3 text-5xl">✅</Text>
          <Text className="text-xl font-bold text-ink">Thanks for your feedback!</Text>
          <Text className="mt-1 text-center text-sm text-muted">
            You've already completed this survey. The Impact Team appreciates it.
          </Text>
          <Button label="Done" className="mt-6" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    await submit.mutateAsync(values);
    router.back();
  });

  const statement = `This event (${event?.title ?? "the session"}) helped me learn something new.`;

  return (
    <Screen scroll>
      <View className="mb-6 mt-4">
        <Text className="text-2xl font-extrabold text-forest">Quick feedback</Text>
        <Text className="mt-1 text-sm text-muted">Two quick questions — under 30 seconds.</Text>
      </View>

      <Controller
        control={control}
        name="learning_scale"
        render={({ field, fieldState }) => (
          <Field label={statement} required error={fieldState.error?.message}>
            <LikertScale value={field.value} onChange={field.onChange} />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="most_helpful"
        render={({ field, fieldState }) => (
          <Field label="Which category did this event help you MOST with?" required error={fieldState.error?.message}>
            {SURVEY_CATEGORY_OPTIONS.map((opt) => (
              <CheckboxRow
                key={opt.value}
                label={opt.label}
                checked={field.value === opt.value}
                onToggle={() => field.onChange(opt.value)}
              />
            ))}
          </Field>
        )}
      />

      <Controller
        control={control}
        name="other_thoughts"
        render={({ field }) => (
          <Field label="Any other thoughts? (optional)">
            <Input
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Share anything else…"
              multiline
              className="h-24"
              style={{ textAlignVertical: "top" }}
            />
          </Field>
        )}
      />

      <Button label="Submit feedback" onPress={onSubmit} loading={submit.isPending} className="mt-2" />
      <View className="h-10" />
    </Screen>
  );
}
