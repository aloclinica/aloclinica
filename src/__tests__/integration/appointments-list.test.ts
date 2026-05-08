import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { server } from "@/mocks/server";
import { mockAppointments, errorHandlers, TEST_SUPABASE_URL } from "@/mocks/handlers";

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Appointments API (MSW integration)", () => {
  it("GET returns list of appointments", async () => {
    const url = `${TEST_SUPABASE_URL}/rest/v1/appointments`;
    const res = await fetch(url);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(mockAppointments.length);
    expect(data[0].id).toBe("appt-1");
  });

  it("POST creates a new appointment", async () => {
    const url = `${TEST_SUPABASE_URL}/rest/v1/appointments`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_id: "doc-1", patient_id: "pat-1", status: "scheduled", scheduled_at: "2026-05-01T09:00:00Z" }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data[0].id).toBe("appt-new");
  });

  it("DELETE removes an appointment", async () => {
    const url = `${TEST_SUPABASE_URL}/rest/v1/appointments?id=eq.appt-1`;
    const res = await fetch(url, { method: "DELETE" });
    expect(res.status).toBe(204);
  });

  it("handles 500 error", async () => {
    server.use(...errorHandlers);
    const url = `${TEST_SUPABASE_URL}/rest/v1/appointments`;
    const res = await fetch(url);
    expect(res.status).toBe(500);
  });
});
