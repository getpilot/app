import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createConnectionFromSession } from "@/lib/db/connection";

export const getSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
};

export const getUser = async () => {
  const session = await getSession();
  return session?.user;
};

/**
 * Gets an RLS-aware database connection for the current user
 * @returns Database connection with RLS context set
 */
export const getRLSDb = async () => {
  const session = await getSession();
  return createConnectionFromSession(session ? { token: session.session.token } : null);
};