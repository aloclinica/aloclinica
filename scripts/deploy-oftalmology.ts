#!/usr/bin/env npx ts-node
/**
 * Deploy script para módulo de oftalmologia
 * Executa migrations e faz deploy de edge functions
 *
 * Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node scripts/deploy-oftalmology.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function executeMigration(filepath: string): Promise<boolean> {
  const name = path.basename(filepath);
  try {
    const sql = fs.readFileSync(filepath, "utf-8");
    const { error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      console.error(`  ❌ ${name}: ${error.message}`);
      return false;
    }

    console.log(`  ✅ ${name}`);
    return true;
  } catch (err) {
    console.error(`  ❌ ${name}: ${err}`);
    return false;
  }
}

async function deployFunctions() {
  console.log("\n📦 Edge Functions (deploy via Supabase dashboard ou CLI):");
  const functions = [
    "generate-ophthalmology-prescription",
    "notify-expired-prescriptions",
  ];

  functions.forEach((fn) => {
    console.log(`  • supabase functions deploy ${fn}`);
  });

  return true;
}

async function main() {
  console.log("🏥 Deploying Oftalmologia Module\n");

  console.log("📊 Migrations:");
  const migrationDir = path.join(__dirname, "../supabase/migrations");
  const oftalmologyMigrations = [
    "20260413160000_ophthalmology_complete.sql",
    "20260413170000_ophthalmology_notification_column.sql",
    "20260413180000_ophthalmology_prescription_review.sql",
  ];

  let allSuccess = true;
  for (const migration of oftalmologyMigrations) {
    const filepath = path.join(migrationDir, migration);
    if (fs.existsSync(filepath)) {
      const success = await executeMigration(filepath);
      allSuccess = allSuccess && success;
    } else {
      console.error(`  ❌ ${migration} not found`);
      allSuccess = false;
    }
  }

  await deployFunctions();

  console.log("\n⚙️ Cron Job (configure via Supabase dashboard):");
  console.log("  Schedule: Daily at 9:00 AM");
  console.log("  Function: notify-expired-prescriptions");
  console.log("  Cron: 0 9 * * *");

  console.log("\n📋 Post-Deployment Checklist:");
  console.log("  [ ] Verify all migrations applied");
  console.log("  [ ] Deploy edge functions via CLI");
  console.log("  [ ] Configure cron job in Supabase dashboard");
  console.log("  [ ] Test prescription booking flow");
  console.log("  [ ] Test PDF generation");
  console.log("  [ ] Verify email template");

  if (!allSuccess) {
    console.error("\n❌ Some migrations failed");
    process.exit(1);
  }

  console.log("\n✅ Deployment complete!");
}

main().catch(console.error);
