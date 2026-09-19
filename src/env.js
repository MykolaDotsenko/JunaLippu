import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/** @param {string} name */
const requiredInProduction = (name) =>
  process.env.NODE_ENV === "production"
    ? z.string().min(1, `${name} is required in production`)
    : z.string().optional();

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXTAUTH_SECRET: requiredInProduction("NEXTAUTH_SECRET"),
    NEXTAUTH_URL: z.preprocess(
      (str) => process.env.VERCEL_URL ?? str,
      process.env.VERCEL ? z.string() : z.string().url(),
    ),
    GOOGLE_CLIENT_ID: requiredInProduction("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: requiredInProduction("GOOGLE_CLIENT_SECRET"),
  },
  client: {
    // Optional: when set, pages emit an absolute canonical and og:url.
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
