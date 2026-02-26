import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { env } from "@/env";
import { polarInstance } from "@/lib/polar/server";
import { polar, checkout, portal } from "@polar-sh/better-auth";

export const auth = betterAuth({
  baseURL:
    process.env.VERCEL === "1"
      ? process.env.VERCEL_ENV === "production"
        ? process.env.BETTER_AUTH_URL
        : process.env.VERCEL_ENV === "preview"
          ? `https://${process.env.VERCEL_URL}`
          : undefined
      : undefined,
  trustedOrigins: [
    "http://localhost:3000",
    ...(env.NEXT_PUBLIC_APP_URL ? [env.NEXT_PUBLIC_APP_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    nextCookies(),
    polar({
      client: polarInstance,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "89404de5-5d64-45fd-872d-d5969cf059ce",
              slug: "Pilot-Starter-Month",
            },
            {
              productId: "640c8f73-66dd-43ab-83a3-ecf6e01bf01e",
              slug: "Pilot-Starter-Annual",
            },
            {
              productId: "b1b9e32b-9417-4e99-8142-11ee6ce45bdc",
              slug: "Pilot-Premium-Month",
            },
            {
              productId: "a9ad37ae-90cd-4c2e-8fd6-88a430f8afb6",
              slug: "Pilot-Premium-Annual",
            },
          ],
          authenticatedUsersOnly: true,
          successUrl: "/sidekick-onboarding",
        }),
        portal(),
      ],
    }),
  ],
});
