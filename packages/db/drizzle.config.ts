import { config } from 'dotenv';
import { defineConfig } from "drizzle-kit";

config();

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  entities: {
    roles: {
      provider: 'neon'
    }
  },
  verbose: true,
  strict: true,
});
