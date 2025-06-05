import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  driver: "better-sqlite",
  dbCredentials: {
    url: "database.db"
  },
});