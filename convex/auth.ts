import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth";
import { polar, checkout, portal } from "@polar-sh/better-auth";
import { polarInstance } from "../src/lib/polar/server";
import { nextCookies } from "better-auth/next-js";

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
    trustedOrigins: [
      "http://localhost:3000",
      ...(process.env.NEXT_PUBLIC_APP_URL
        ? [process.env.NEXT_PUBLIC_APP_URL]
        : []),
    ],
    database: authComponent.adapter(ctx),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    plugins: [
      nextCookies(),
      convex(),
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
};

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});