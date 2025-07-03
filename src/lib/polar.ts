import { Polar } from "@polar-sh/sdk";

export const polarInstance = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN || (() => {
    throw new Error("POLAR_ACCESS_TOKEN environment variable is required");
  })(),
  server: "sandbox",
});