import { z } from "zod";

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(4000),
});
export type MessageValues = z.infer<typeof messageSchema>;

export const blastSchema = z
  .object({
    audience: z.enum(["all_attendees", "event_registrants"]),
    event_id: z.string().uuid().optional(),
    subject: z.string().trim().max(120).optional(),
    body: z.string().trim().min(1, "Blast body is required").max(4000),
  })
  .superRefine((val, ctx) => {
    if (val.audience === "event_registrants" && !val.event_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["event_id"],
        message: "Choose which event's registrants to message",
      });
    }
  });
export type BlastValues = z.infer<typeof blastSchema>;
