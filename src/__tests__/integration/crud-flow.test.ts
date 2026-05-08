import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { server } from "@/mocks/server";
import { TEST_SUPABASE_URL } from "@/mocks/handlers";

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const BASE = `${TEST_SUPABASE_URL}/rest/v1`;

describe("CRUD flow (MSW integration)", () => {
  it("lists profiles", async () => {
    const res = await fetch(`${BASE}/profiles`);
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data[0].first_name).toBe("João");
  });

  it("creates an appointment and returns 201", async () => {
    const res = await fetch(`${BASE}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_id: "doc-2", status: "scheduled", scheduled_at: "2026-06-01T10:00:00Z" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data[0]).toHaveProperty("id");
  });

  it("deletes an appointment and returns 204", async () => {
    const res = await fetch(`${BASE}/appointments?id=eq.appt-1`, { method: "DELETE" });
    expect(res.status).toBe(204);
  });
});
