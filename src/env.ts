import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // BetterAuth
    BETTER_AUTH_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    // Database
    DATABASE_URL: z.string().min(1),
    // Google
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    // Polar
    POLAR_ACCESS_TOKEN: z.string().min(1),
    POLAR_ORG_SLUG: z.string().min(1),
    // Instagram
    INSTAGRAM_CLIENT_ID: z.string().min(1),
    INSTAGRAM_CLIENT_SECRET: z.string().min(1),
    // Instagram Webhook
    IG_WEBHOOK_VERIFY_TOKEN: z.string().min(1),
    // Instagram/Meta App Secret (for webhook HMAC + token refresh)
    IG_APP_SECRET: z.string().optional(),
    // Cloudinary
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    // Gemini API
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    // Sentry
    SENTRY_AUTH_TOKEN: z.string().min(1),
    SENTRY_DSN: z.string().min(1),
    // Node env
    NODE_ENV: z.string().min(1),
    // Waitlist API Token
    WAITLIST_API_TOKEN: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
});