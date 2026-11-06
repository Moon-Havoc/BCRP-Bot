import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { bcrpPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.bcrpPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.bcrpPrisma = prisma;

export type { Prisma, PrismaClient } from "@prisma/client";
export { ModerationCaseType } from "@prisma/client";
