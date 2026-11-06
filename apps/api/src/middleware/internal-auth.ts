import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

const internalSecretSchema = z.string().min(32).max(256);

export function isValidInternalSecret(provided: string | undefined, expected: string): boolean {
  if (!provided) return false;
  const parsed = internalSecretSchema.safeParse(provided);
  if (!parsed.success) return false;
  const providedBytes = Buffer.from(parsed.data);
  const expectedBytes = Buffer.from(expected);
  return (
    providedBytes.byteLength === expectedBytes.byteLength &&
    timingSafeEqual(providedBytes, expectedBytes)
  );
}
