import { polarClient } from "@polar-sh/better-auth";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    plugins: [polarClient()]
});

export const { signIn, signOut, signUp, useSession } = authClient;

export function useUser() {
  const session = useSession();
  return { 
    user: session.data?.user,
    isLoading: session.isPending,
  };
}