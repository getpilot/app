import { Polar } from "@polar-sh/sdk";
import { env } from "@/env";

export const polarInstance = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
});