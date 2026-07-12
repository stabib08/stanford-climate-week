import { z } from "zod";

/**
 * Event authoring schema. Events are created via GitHub (a seed/admin script),
 * NOT the mobile app — but this schema validates that pipeline and powers any
 * future admin console. The 50-word description cap is enforced here.
 */
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export const eventSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z
      .string()
      .trim()
      .refine((s) => wordCount(s) <= 50, "Description must be 50 words or fewer"),
    starts_at: z.string().datetime({ offset: true }),
    ends_at: z.string().datetime({ offset: true }),
    location: z.string().trim().min(1).max(200),
    cover_art_url: z.string().url().optional().nullable(),
    format_tags: z.array(z.string()).default([]),
    sector_tags: z.array(z.string()).default([]),
    speakers: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          role: z.string().trim().optional(),
        }),
      )
      .default([]),
  })
  .refine((v) => new Date(v.ends_at) > new Date(v.starts_at), {
    path: ["ends_at"],
    message: "End time must be after start time",
  });

export type EventInput = z.infer<typeof eventSchema>;
