import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { env } from "@/env";
import { polarInstance } from "./polar";
import { polar, checkout, portal } from "@polar-sh/better-auth";
 
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
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
          authenticatedUsersOnly: true,
          successUrl: "/upgrade",
        }),
        portal(),
      ]
    }),
  ]
});