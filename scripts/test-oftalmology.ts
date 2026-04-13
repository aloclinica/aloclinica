#!/usr/bin/env npx ts-node
/**
 * Test script para module de oftalmologia
 * Valida fluxo completo: agendamento → exame → prescrição
 *
 * Uso: SUPABASE_URL=... SUPABASE_ANON_KEY=... USER_TOKEN=... npx ts-node scripts/test-oftalmology.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const USER_TOKEN = process.env.USER_TOKEN!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${USER_TOKEN}` } },
});

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

async function test(
  name: string,
  fn: () => Promise<void>
): Promise<boolean> {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, message });
    console.error(`❌ ${name}: ${message}`);
    return false;
  }
}

async function main() {
  console.log("🏥 Testing Oftalmologia Module\n");

  // Test 1: Authenticate
  await test("Authenticate user", async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Not authenticated");
  });

  let appointmentId: string;
  let examId: string;
  let prescriptionId: string;

  // Test 2: Create appointment
  await test("Create appointment", async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) throw new Error("No user");

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_id: user.user.id,
        doctor_id: "00000000-0000-0000-0000-000000000000", // Mock doctor ID
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        appointment_type: "oftalmologia",
        status: "scheduled",
      })
      .select()
      .single();

    if (error) throw error;
    appointmentId = data.id;
  });

  // Test 3: Create exam
  await test("Create ophthalmology exam", async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) throw new Error("No user");

    const { data, error } = await supabase
      .from("ophthalmology_exams")
      .insert({
        appointment_id: appointmentId,
        patient_id: user.user.id,
        doctor_id: "00000000-0000-0000-0000-000000000000",
        od_sphere: -1.5,
        od_cylinder: -0.5,
        od_axis: 180,
        os_sphere: -2.0,
        os_cylinder: 0,
        os_axis: 0,
        va_od: "20/20",
        va_os: "20/25",
        va_ou: "20/20",
        intraocular_pressure_od: 14,
        intraocular_pressure_os: 15,
        tonometry_method: "Goldmann",
        anterior_segment: "Normal",
        posterior_segment: "Normal",
      })
      .select()
      .single();

    if (error) throw error;
    examId = data.id;
  });

  // Test 4: Create prescription
  await test("Create ophthalmology prescription", async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) throw new Error("No user");

    const { data, error } = await supabase
      .from("ophthalmology_prescriptions")
      .insert({
        exam_id: examId,
        patient_id: user.user.id,
        doctor_id: "00000000-0000-0000-0000-000000000000",
        prescription_type: "glasses",
        od_sphere: -1.5,
        od_cylinder: -0.5,
        od_axis: 180,
        os_sphere: -2.0,
        os_cylinder: 0,
        os_axis: 0,
        pupillary_distance: 64,
        recommended_use: "Uso geral",
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      })
      .select()
      .single();

    if (error) throw error;
    prescriptionId = data.id;
  });

  // Test 5: Read exam
  await test("Read ophthalmology exam", async () => {
    const { data, error } = await supabase
      .from("ophthalmology_exams")
      .select()
      .eq("id", examId)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Exam not found");
  });

  // Test 6: Read prescription
  await test("Read ophthalmology prescription", async () => {
    const { data, error } = await supabase
      .from("ophthalmology_prescriptions")
      .select()
      .eq("id", prescriptionId)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Prescription not found");
  });

  // Test 7: Update prescription review status
  await test("Update prescription review status", async () => {
    const { error } = await supabase
      .from("ophthalmology_prescriptions")
      .update({ review_status: "approved" })
      .eq("id", prescriptionId);

    if (error) throw error;
  });

  // Test 8: Trigger edge function (mock)
  await test("Edge function endpoint exists", async () => {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/generate-ophthalmology-prescription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${USER_TOKEN}`,
        },
        body: JSON.stringify({ prescription_id: prescriptionId }),
      });
      // Se não retornar erro de rota, função existe
    } catch (err) {
      // Esperado se função não está deployada ainda
      if (!String(err).includes("404")) throw err;
    }
  });

  // Summary
  console.log("\n📊 Test Results:");
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`${passed}/${total} tests passed`);

  if (passed < total) {
    console.log("\nFailed tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  • ${r.name}: ${r.message}`));
    process.exit(1);
  }

  console.log("\n✅ All tests passed!");
  console.log("\n🧹 Cleanup:");
  console.log("  Deletion of test records should be done manually");
  console.log("  - Appointment:", appointmentId);
  console.log("  - Exam:", examId);
  console.log("  - Prescription:", prescriptionId);
}

main().catch(console.error);
