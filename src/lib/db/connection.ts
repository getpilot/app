import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@/lib/db/schema";
import { env } from "@/env";

/**
 * Creates a database connection with RLS context for authenticated users
 * @param token - JWT token from Better Auth session
 * @returns Drizzle database instance with RLS context
 */
export function createRLSConnection(token: string) {
  const client = neon(env.DATABASE_URL);

  const setRLSContext = async () => {
    try {
      await client`
        SELECT set_config('request.jwt.claims', ${token}, true);
      `;

      const userId = extractUserIdFromToken(token);
      if (userId) {
        await client`
          SELECT set_config('request.jwt.claim.sub', ${userId}, true);
        `;
      }
    } catch (error) {
      console.error("Error setting RLS context:", error);
    }
  };

  setRLSContext();

  return drizzle(client, {
    schema,
    logger: true,
  });
}

/**
 * Creates a basic database connection without RLS context
 * Used when no authentication session is available
 */
export function createBasicConnection() {
  const client = neon(env.DATABASE_URL);

  return drizzle(client, {
    schema,
    logger: true,
  });
}

/**
 * Extracts user ID from JWT token
 * @param token - JWT token string
 * @returns User ID or null if not found
 */
function extractUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || payload.userId || null;
  } catch (error) {
    console.error("Error extracting user ID from token:", error);
    return null;
  }
}

/**
 * Creates a database connection based on authentication context
 * @param session - Better Auth session object
 * @returns RLS-aware database connection or basic connection
 */
export function createConnectionFromSession(
  session: { token?: string } | null
) {
  if (session?.token) {
    return createRLSConnection(session.token);
  }

  return createBasicConnection();
}