import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

// Next.js loads .env.local automatically, drizzle-kit does not.
config({ path: ".env.local" })

// Migrations run over a direct (unpooled) connection — PgBouncer does not
// support the session state that DDL and advisory locks rely on.
const url = process.env.DATABASE_URL_UNPOOLED

if (!url) {
  throw new Error("DATABASE_URL_UNPOOLED is not set in .env.local")
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  casing: "snake_case",
  verbose: true,
  strict: true,
})
