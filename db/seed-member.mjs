#!/usr/bin/env node
// Adds (or updates) one allowlisted invoice-portal member. Idempotent —
// re-running with the same email just updates the name/permission instead
// of erroring on the unique constraint.
//
// Usage:
//   node --env-file=.env.local db/seed-member.mjs <email> [name] [--can-delete]
//
// Example:
//   node --env-file=.env.local db/seed-member.mjs dinesh@visionsquareinc.com "Dinesh" --can-delete

import { neon } from "@neondatabase/serverless";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Run with `node --env-file=.env.local db/seed-member.mjs ...`.");
    process.exit(1);
  }

  const args = process.argv.slice(2).filter((a) => a !== "--can-delete");
  const canDelete = process.argv.includes("--can-delete");
  const [email, name] = args;
  if (!email) {
    console.error("Usage: node --env-file=.env.local db/seed-member.mjs <email> [name] [--can-delete]");
    process.exit(1);
  }

  const sql = neon(connectionString);
  await sql`
    insert into invoice_members (email, name, can_delete_invoices)
    values (${email.toLowerCase()}, ${name ?? null}, ${canDelete})
    on conflict (email) do update set
      name = coalesce(excluded.name, invoice_members.name),
      can_delete_invoices = excluded.can_delete_invoices
  `;

  console.log(`✓ ${email} can now sign in to the invoice portal${canDelete ? " (can delete invoices)" : ""}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
