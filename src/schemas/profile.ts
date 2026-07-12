import { z } from "zod";

/**
 * Profile onboarding schema. Mirrors the Postgres CHECK constraints so the
 * client rejects invalid combinations before they ever reach Supabase.
 */

export const involvementRole = z.enum([
  "organizer",
  "event_lead",
  "attendee",
  "speaker",
]);

export const degreeType = z.enum(["undergrad", "masters", "phd"]);

export const externalSector = z.enum([
  "academia",
  "govt_policy",
  "nonprofit_public",
  "private_company",
  "vc_investment",
  "independent",
]);

export const climateIdentity = z.enum([
  "inspire_indifferent",
  "empower_engaged",
  "mobilize_motivated",
]);

export const climatePainPoint = z.enum([
  "lack_knowledge",
  "lack_connections",
  "lack_skillset",
  "other",
]);

export const profileSchema = z
  .object({
    full_name: z.string().trim().min(1, "Full name is required").max(120),
    location: z.string().trim().min(1, "Please tell us where you're based").max(200),
    involvement: z
      .array(involvementRole)
      .min(1, "Select at least one involvement"),
    is_stanford_student: z.boolean({
      required_error: "Please tell us if you're a Stanford student",
    }),

    // Stanford branch (validated conditionally below)
    degree: degreeType.optional(),
    stanford_year: z
      .number()
      .int()
      .min(2027)
      .max(2030)
      .optional(),
    area_of_study: z.string().trim().max(120).optional(),

    // External branch
    external_sector: externalSector.optional(),
    background_affiliation: z.string().trim().max(300).optional(),

    // Climate positioning (pre-event intent)
    climate_identity: climateIdentity,
    climate_pain_point: climatePainPoint,
    climate_pain_point_other: z.string().trim().max(300).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.is_stanford_student) {
      if (!val.degree)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["degree"],
          message: "Degree is required",
        });
      if (!val.stanford_year)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stanford_year"],
          message: "Year is required",
        });
      if (!val.area_of_study)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["area_of_study"],
          message: "Area of study is required",
        });
    } else {
      if (!val.external_sector)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["external_sector"],
          message: "Please select the category that fits you best",
        });
      if (!val.background_affiliation)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["background_affiliation"],
          message: "Please describe your background / affiliation",
        });
    }

    if (val.climate_pain_point === "other" && !val.climate_pain_point_other) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["climate_pain_point_other"],
        message: "Please describe your pain point",
      });
    }
  });

export type ProfileFormValues = z.infer<typeof profileSchema>;

/** Auth entry schema (email sign-in / magic link). */
export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
});
export type EmailFormValues = z.infer<typeof emailSchema>;

export const isStanfordEmail = (email: string) =>
  /@(stanford\.edu|.*\.stanford\.edu)$/i.test(email.trim());
