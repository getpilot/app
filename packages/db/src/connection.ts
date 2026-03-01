import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return databaseUrl;
}

/**
 * Creates a database connection with RLS context for authenticated users
 * @param token - JWT token from Better Auth session
 * @returns Drizzle database instance with RLS context
 */
export function createRLSConnection() {
  const client = neon(requireDatabaseUrl());

  return drizzle(client, {
    schema,
    logger: true,
  });
}

/**
 * Sets RLS context for a given client and token
 * @param client - Neon client instance
 * @param token - JWT token
 */
export async function setRLSContext(
  client: ReturnType<typeof neon>,
  token: string
) {
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
}

/**
 * Creates a basic database connection without RLS context
 * Used when no authentication session is available
 */
export function createBasicConnection() {
  const client = neon(requireDatabaseUrl());

  return drizzle(client, {
    schema,
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
    return createRLSConnection();
  }

  return createBasicConnection();
}

