import { z } from "zod";

export const surveyCategory = z.enum([
  "industry_knowledge",
  "peer_connections",
  "directed_skillset",
]);

/** Post-event micro-survey (shown after an attended event). */
export const postEventSurveySchema = z.object({
  learning_scale: z
    .number({ required_error: "Please rate this statement" })
    .int()
    .min(1, "Please rate this statement")
    .max(5),
  most_helpful: surveyCategory,
  other_thoughts: z.string().trim().max(1000).optional(),
});
export type PostEventSurveyValues = z.infer<typeof postEventSurveySchema>;

/** Post-SCW survey is TBD; stored as flexible JSON, validated loosely for now. */
export const postScwSurveySchema = z.object({
  overall_rating: z.number().int().min(1).max(5).optional(),
  would_return: z.boolean().optional(),
  highlight: z.string().trim().max(2000).optional(),
  improvements: z.string().trim().max(2000).optional(),
});
export type PostScwSurveyValues = z.infer<typeof postScwSurveySchema>;
