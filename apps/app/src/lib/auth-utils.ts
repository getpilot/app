import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  createRLSConnection,
  createBasicConnection,
  setRLSContext,
} from "@pilot/db/connection";
import { neon } from "@neondatabase/serverless";
import { env } from "@/env";

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

  if (session?.session?.token) {
    const client = neon(env.DATABASE_URL);
    await setRLSContext(client as ReturnType<typeof neon>, session.session.token);
    return createRLSConnection();
  }

  return createBasicConnection();
};
