import React from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { LikertScale } from "@/components/survey/LikertScale";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { postScwSurveySchema, type PostScwSurveyValues } from "@/schemas/survey";

/**
 * Final post-SCW survey (questions TBD). Responses are stored as flexible JSON
 * in post_scw_surveys so the Impact Team can finalize the instrument later
 * without a schema migration.
 */
export default function PostScwSurvey() {
  const router = useRouter();
  const { userId } = useAuth();
  const { control, handleSubmit, formState } = useForm<PostScwSurveyValues>({
    resolver: zodResolver(postScwSurveySchema),
    defaultValues: { highlight: "", improvements: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!userId) return;
    await supabase
      .from("post_scw_surveys")
      .upsert({ user_id: userId, responses: values }, { onConflict: "user_id" });
    router.back();
  });

  return (
    <Screen scroll>
      <View className="mb-6 mt-4">
        <Text className="text-2xl font-extrabold text-forest">Reflecting on SCW</Text>
        <Text className="mt-1 text-sm text-muted">Help us make next year even better.</Text>
      </View>

      <Controller
        control={control}
        name="overall_rating"
        render={({ field }) => (
          <Field label="Overall, how would you rate Stanford Climate Week?">
            <LikertScale value={field.value} onChange={field.onChange} lowLabel="Poor" highLabel="Excellent" />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="highlight"
        render={({ field }) => (
          <Field label="What was your highlight?">
            <Input value={field.value} onChangeText={field.onChange} placeholder="A session, a connection, an idea…" multiline className="h-24" style={{ textAlignVertical: "top" }} />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="improvements"
        render={({ field }) => (
          <Field label="What could we improve?">
            <Input value={field.value} onChangeText={field.onChange} placeholder="Your suggestions…" multiline className="h-24" style={{ textAlignVertical: "top" }} />
          </Field>
        )}
      />

      <Button label="Submit" onPress={onSubmit} loading={formState.isSubmitting} className="mt-2" />
      <View className="h-10" />
    </Screen>
  );
}
