import { Polar } from "@polar-sh/sdk";

export const polarInstance = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});