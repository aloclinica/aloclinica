import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Authorization ──
    // The caller must be authenticated. Privilege escalation is prevented by:
    //  - admin role can NEVER be granted via this endpoint
    //  - non-admins may only assign a role to THEMSELVES
    //  - self-assigning a doctor-type role requires a valid, unused invite code
    const caller = await getCaller(req);
    if (!caller.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, role, profile_data } = await req.json();

    if (!user_id || !role) {
      return new Response(JSON.stringify({ error: "user_id and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validRoles = ["patient", "doctor", "clinic", "receptionist", "support", "partner", "affiliate", "laudista"];
    if (!validRoles.includes(role)) {
      // "admin" is intentionally excluded — it can never be granted here.
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Non-admins may only assign a role to themselves.
    if (!caller.isAdmin && user_id !== caller.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: Doctor-type roles grant access to patient medical data. A non-admin
    // must present the SECRET invite CODE STRING (never a UUID id read via RLS) and we
    // atomically CLAIM it with the service-role client. Only exactly-one claimed row —
    // that was unused and not expired — authorizes the grant. This closes the privilege
    // escalation where any authenticated user could self-grant `doctor` from a leaked id.
    const doctorTypeRoles = ["doctor", "laudista"];
    let claimedInviteId: string | null = null;
    if (!caller.isAdmin && doctorTypeRoles.includes(role)) {
      const inviteCode = profile_data?.invite_code;
      if (!inviteCode || typeof inviteCode !== "string") {
        return new Response(JSON.stringify({ error: "Valid invite code required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // SECURITY: atomic claim against the LIVE schema (doctor_invite_codes uses
      // max_uses / current_uses / is_active — NOT is_used/expires_at). We read the
      // row by secret code, verify it is active and has remaining uses, then do an
      // optimistic compare-and-swap: increment current_uses only if it is unchanged
      // and the code is still active. If we lose the race (0 rows), the claim fails.
      const normalizedCode = inviteCode.trim().toUpperCase();
      const { data: codeRow, error: codeErr } = await supabase
        .from("doctor_invite_codes")
        .select("id, current_uses, max_uses, is_active")
        .eq("code", normalizedCode)
        .maybeSingle();
      if (
        codeErr || !codeRow || codeRow.is_active !== true ||
        (codeRow.max_uses != null && (codeRow.current_uses ?? 0) >= codeRow.max_uses)
      ) {
        return new Response(JSON.stringify({ error: "Valid invite code required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: claimed, error: claimErr } = await supabase
        .from("doctor_invite_codes")
        .update({ current_uses: (codeRow.current_uses ?? 0) + 1 })
        .eq("id", codeRow.id)
        .eq("current_uses", codeRow.current_uses ?? 0) // CAS guard
        .eq("is_active", true)
        .select("id");
      if (claimErr || !claimed || claimed.length !== 1) {
        return new Response(JSON.stringify({ error: "Valid invite code required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      claimedInviteId = codeRow.id;
    }

    // Insert role (ignore conflict if already exists)
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id, role })
      .select()
      .single();

    // If duplicate, that's fine
    if (roleError && !roleError.message.includes("duplicate")) {
      console.error("Role insert error:", roleError);
    }

    // Create profile-specific records if needed
    // Doctor-like roles all get a doctor_profiles row tagged with doctor_type
    const doctorRoles = ["doctor", "laudista"];
    if (doctorRoles.includes(role) && profile_data) {
      const doctorType =
        role === "laudista" ? "laudista"
        : "telemedicina";
      await supabase.from("doctor_profiles").insert({
        user_id,
        crm: profile_data.crm,
        crm_state: profile_data.crm_state || "SP",
        doctor_type: doctorType,
      });
      // Laudistas also get the base "doctor" role for shared features
      if (role !== "doctor") {
        await supabase.from("user_roles").insert({ user_id, role: "doctor" });
      }
    }

    if (role === "partner" && profile_data) {
      await supabase.from("partner_profiles").insert({
        user_id,
        business_name: profile_data.business_name,
        cnpj: profile_data.cnpj || null,
        partner_type: profile_data.partner_type || "pharmacy",
      });
    }

    if (role === "clinic" && profile_data) {
      await supabase.from("clinic_profiles").insert({
        user_id,
        name: profile_data.name,
        cnpj: profile_data.cnpj || null,
      });
    }

    if (role === "affiliate") {
      await supabase.from("affiliate_profiles").insert({
        user_id,
        pix_key: profile_data?.pix_key || null,
        is_approved: false,
        commission_percent: 2,
      });
    }

    // SECURITY: The invite code is already atomically claimed above (by secret code
    // string, not by a client-supplied id). We intentionally do NOT re-mark any code
    // by `invite_code_id` from the body here — trusting that id let a caller flip the
    // used-state of arbitrary codes. `claimedInviteId` records which code was consumed.
    void claimedInviteId;

    // Fire welcome email based on role (non-blocking)
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
      const email = authUser?.user?.email;
      if (email) {
        const { data: profile } = await supabase.from("profiles")
          .select("first_name, last_name").eq("user_id", user_id).maybeSingle();
        const fullName = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : (profile_data?.name || "");
        const typeMap: Record<string, string> = {
          patient: "welcome",
          doctor: "welcome_doctor",
          clinic: "welcome_clinic",
          laudista: "welcome_laudista",
        };
        const emailType = typeMap[role];
        if (emailType) {
          const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
          const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
            body: JSON.stringify({
              type: emailType,
              to: email,
              data: {
                name: fullName || email,
                clinic_name: profile_data?.name || "",
                crm: profile_data?.crm || "",
              },
            }),
          }).catch((e) => console.warn("Welcome email failed:", e));
        }
      }
    } catch (e: any) {
      console.warn("assign-role welcome email dispatch failed:", e);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("assign-role error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
