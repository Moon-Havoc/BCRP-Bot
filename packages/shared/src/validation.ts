import { z } from "zod";

export const snowflakeSchema = z.string().regex(/^\d{17,20}$/, "Expected a Discord snowflake");
export const nonEmptyStringSchema = z.string().trim().min(1).max(2000);

export const apiSuccessSchema = <T extends z.ZodType>(data: T) =>
  z.object({ ok: z.literal(true), data, requestId: z.string() });

export const apiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
  requestId: z.string(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
