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

const DATABASE_URL = requireDatabaseUrl();

const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });

