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

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDbInstance() {
  if (!dbInstance) {
    const sql = neon(requireDatabaseUrl());
    dbInstance = drizzle(sql, { schema });
  }

  return dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const instance = getDbInstance();
    const value = Reflect.get(instance, prop);

    return typeof value === "function" ? value.bind(instance) : value;
  },
});
