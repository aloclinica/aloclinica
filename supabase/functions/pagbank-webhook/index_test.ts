import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
await load({ export: true, allowEmptyValues: true, examplePath: null }).catch(() => {});
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAGBANK_TOKEN = Deno.env.get("PAGBANK_TOKEN") || "";
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/pagbank-webhook`;

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// deno-lint-ignore no-explicit-any
async function pickDoctor(admin: any): Promise<string> {
  const { data } = await admin.from("appointments").select("doctor_id").not("doctor_id", "is", null).limit(1);
  if (data?.[0]?.doctor_id) return data[0].doctor_id as string;
  const { data: profs } = await admin.from("profiles").select("id").limit(1);
  return profs[0].id as string;
}

// deno-lint-ignore no-explicit-any
async function pickPatient(admin: any, exclude: string): Promise<string> {
  const { data } = await admin.from("profiles").select("id").neq("id", exclude).limit(1);
  return data[0].id as string;
}

Deno.test("PagBank webhook: PIX PAID approves the appointment", async () => {
  assert(SERVICE_ROLE, "SUPABASE_SERVICE_ROLE_KEY required");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const doctorId = await pickDoctor(admin);
  const patientId = await pickPatient(admin, doctorId);

  // 1) Create test appointment
  const { data: appt, error } = await admin.from("appointments").insert({
    doctor_id: doctorId,
    patient_id: patientId,
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    status: "scheduled",
    payment_status: "pending",
    price: 1.00,
    notes: "PAGBANK_WEBHOOK_TEST",
  }).select("id").single();
  if (error) throw error;
  const appointmentId = appt.id as string;

  try {
    // 2) Build PagBank-shaped payload
    const payload = {
      id: `ORDE_TEST_${appointmentId}`,
      reference_id: appointmentId,
      charges: [{
        id: `CHAR_TEST_${appointmentId}`,
        reference_id: appointmentId,
        status: "PAID",
        payment_method: { type: "PIX" },
      }],
    };
    const body = JSON.stringify(payload);
    const sig = PAGBANK_TOKEN ? await sha256Hex(PAGBANK_TOKEN + body) : "";

    // 3) Call webhook
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(sig ? { "x-authenticity-token": sig } : {}),
      },
      body,
    });
    const text = await res.text();
    console.log("PIX webhook response:", res.status, text);
    assertEquals(res.status, 200);

    // 4) Check DB updated
    const { data: updated } = await admin
      .from("appointments").select("status, payment_status, payment_confirmed_at")
      .eq("id", appointmentId).single();
    assertEquals(updated?.payment_status, "approved");
    assertEquals(updated?.status, "confirmed");
    assert(updated?.payment_confirmed_at, "payment_confirmed_at should be set");
  } finally {
    await admin.from("appointments").delete().eq("id", appointmentId);
  }
});

Deno.test("PagBank webhook: CREDIT_CARD DECLINED marks refused", async () => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const doctorId = await pickDoctor(admin);
  const patientId = await pickPatient(admin, doctorId);

  const { data: appt } = await admin.from("appointments").insert({
    doctor_id: doctorId,
    patient_id: patientId,
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    status: "scheduled",
    payment_status: "pending",
    price: 1.00,
    notes: "PAGBANK_WEBHOOK_TEST_CARD",
  }).select("id").single();
  const appointmentId = appt!.id as string;

  try {
    const payload = {
      id: `ORDE_TEST_${appointmentId}`,
      reference_id: appointmentId,
      charges: [{ status: "DECLINED", payment_method: { type: "CREDIT_CARD" }, reference_id: appointmentId }],
    };
    const body = JSON.stringify(payload);
    const sig = PAGBANK_TOKEN ? await sha256Hex(PAGBANK_TOKEN + body) : "";
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json", ...(sig ? { "x-authenticity-token": sig } : {}) },
      body,
    });
    await res.text();
    assertEquals(res.status, 200);

    const { data: updated } = await admin
      .from("appointments").select("payment_status").eq("id", appointmentId).single();
    assertEquals(updated?.payment_status, "refused");
  } finally {
    await admin.from("appointments").delete().eq("id", appointmentId);
  }
});

Deno.test("PagBank webhook: invalid signature is rejected", async () => {
  if (!PAGBANK_TOKEN) return; // skip when no token
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-authenticity-token": "deadbeef" },
    body: JSON.stringify({ id: "x", reference_id: "x", charges: [{ status: "PAID" }] }),
  });
  await res.text();
  assertEquals(res.status, 401);
});