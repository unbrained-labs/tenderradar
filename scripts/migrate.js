#!/usr/bin/env node
/**
 * Run schema migrations against the Neon database.
 * Usage: pnpm db:migrate
 */
const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌  DATABASE_URL not set. Copy .env.example to .env.local and fill it in.");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const schemaPath = path.join(__dirname, "../lib/schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  // Split on semicolons and run each statement
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`Running ${statements.length} statements…`);

  for (const stmt of statements) {
    try {
      await sql.query(stmt);
      process.stdout.write(".");
    } catch (err) {
      console.error("\n❌  Error on statement:", stmt.slice(0, 80), "\n", err.message);
    }
  }

  console.log("\n✅  Migration complete.");
}

main().catch(console.error);
