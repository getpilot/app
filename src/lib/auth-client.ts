import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [convexClient(), polarClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

export function useUser() {
  const session = useSession();
  return {
    user: session.data?.user,
    isLoading: session.isPending,
  };
}