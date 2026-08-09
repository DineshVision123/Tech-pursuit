#!/usr/bin/env node
// Runs every .sql file in db/portal-migrations/ against DATABASE_URL that
// hasn't been applied yet, in filename order, tracked in a
// `schema_migrations` table — safe to re-run any time you add a new
// migration file; already-applied ones are skipped automatically.
//
// Usage:
//   node --env-file=.env.local db/run-migrations.mjs

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@neondatabase/serverless";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "portal-migrations");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "DATABASE_URL is not set. Run with `node --env-file=.env.local db/run-migrations.mjs`, " +
        "or export it in your shell first.",
    );
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      create table if not exists schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      )
    `);
    const { rows: applied } = await client.query("select filename from schema_migrations");
    const appliedSet = new Set(applied.map((r) => r.filename));

    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    let ran = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`Skipping ${file} (already applied).`);
        continue;
      }
      console.log(`Running ${file}...`);
      const contents = await readFile(path.join(dir, file), "utf8");
      await client.query(contents);
      await client.query("insert into schema_migrations (filename) values ($1)", [file]);
      console.log("  done.");
      ran++;
    }

    console.log(`\n${ran} new migration(s) applied, ${files.length - ran} already up to date.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
