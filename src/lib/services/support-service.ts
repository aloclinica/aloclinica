import { db } from "@/integrations/supabase/untyped";
import { logError } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TicketCategory = "appointment" | "payment" | "report" | "complaint" | "general";
export type TicketPriority = "low" | "medium" | "high" | "critical";

export interface CreateTicketParams {
  patientId: string;
  subject: string;
  message: string;
  category: TicketCategory;
  priority?: TicketPriority;
  appointmentId?: string;
}

export interface TicketSummary {
  id: string;
  subject: string;
  status: string;
  category: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: string | null;
}

export interface TicketDetail extends TicketSummary {
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isStaff: boolean;
}

// ─── SLA Configuration ───────────────────────────────────────────────────────

const SLA_HOURS: Record<TicketPriority, number> = {
  low: 48,
  medium: 24,
  high: 8,
  critical: 2,
};

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Create a support ticket. Auto-assignment is handled by DB trigger.
 */
export const createTicket = async (params: CreateTicketParams): Promise<string | null> => {
  try {
    const priority = params.priority ?? inferPriority(params.category, params.message);
    const slaDeadline = new Date(Date.now() + SLA_HOURS[priority] * 3600_000);

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        patient_id: params.patientId,
        subject: params.subject,
        priority,
        status: "open",
      } as any)
      .select("id")
      .single();

    if (error || !data) {
      logError("createTicket failed", error);
      return null;
    }

    // Insert the initial message
    await db.from("support_messages").insert({
      ticket_id: data.id,
      sender_id: params.patientId,
      content: params.message,
    });

    // Link to appointment if provided — uses new columns added via migration
    if (params.appointmentId) {
      await db.from("support_tickets").update({
        related_entity_id: params.appointmentId,
        related_entity_type: "appointment",
      } as any).eq("id", data.id);
    }

    return data.id;
  } catch (err) {
    logError("createTicket exception", err);
    return null;
  }
};

/**
 * Get all tickets for a patient.
 */
export const getPatientTickets = async (patientId: string): Promise<TicketSummary[]> => {
  try {
    const { data } = await supabase
      .from("support_tickets")
      .select("id, subject, status, priority, created_at, updated_at, assigned_to")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    return (data ?? []).map((t: any) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      category: t.category ?? "general",
      priority: t.priority ?? "medium",
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      assignedTo: t.assigned_to,
    }));
  } catch (err) {
    logError("getPatientTickets failed", err);
    return [];
  }
};

/**
 * Get ticket detail with messages.
 */
export const getTicketDetail = async (ticketId: string, userId: string): Promise<TicketDetail | null> => {
  try {
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("id, subject, status, priority, created_at, updated_at, assigned_to, patient_id")
      .eq("id", ticketId)
      .single();

    if (!ticket) return null;

    // Verify access: patient or support agent
    if (ticket.patient_id !== userId && ticket.assigned_to !== userId) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "support"]);
      if (!roles?.length) return null;
    }

    // Fetch messages
    const { data: messages } = await supabase
      .from("support_messages")
      .select("id, sender_id, content, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    // Resolve sender names
    const senderIds = [...new Set((messages ?? []).map(m => m.sender_id))];
    const { data: senderProfiles } = senderIds.length
      ? await db.from("profiles").select("user_id, first_name, last_name").in("user_id", senderIds)
      : { data: [] };

    const { data: staffRoles } = senderIds.length
      ? await db.from("user_roles").select("user_id, role").in("user_id", senderIds).in("role", ["support", "admin"])
      : { data: [] };

    const nameMap = new Map<string, string>();
    senderProfiles?.forEach(p => nameMap.set(p.user_id, `${p.first_name} ${p.last_name}`));
    const staffSet = new Set(staffRoles?.map(r => r.user_id) ?? []);

    return {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      category: (ticket as any).category ?? "general",
      priority: ticket.priority ?? "medium",
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      assignedTo: ticket.assigned_to,
      messages: (messages ?? []).map(m => ({
        id: m.id,
        senderId: m.sender_id,
        senderName: nameMap.get(m.sender_id) ?? "Usuário",
        content: m.content,
        createdAt: m.created_at,
        isStaff: staffSet.has(m.sender_id),
      })),
    };
  } catch (err) {
    logError("getTicketDetail failed", err);
    return null;
  }
};

/**
 * Reply to a support ticket.
 */
export const replyToTicket = async (
  ticketId: string,
  senderId: string,
  content: string,
): Promise<boolean> => {
  try {
    const { error } = await db.from("support_messages").insert({
      ticket_id: ticketId,
      sender_id: senderId,
      content,
    });

    if (error) {
      logError("replyToTicket failed", error);
      return false;
    }

    // Update ticket status and timestamp
    await db.from("support_tickets").update({
      status: "in_progress",
      updated_at: new Date().toISOString(),
    }).eq("id", ticketId);

    // Notify the other party
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("patient_id, assigned_to")
      .eq("id", ticketId)
      .single();

    if (ticket) {
      const recipientId = senderId === ticket.patient_id ? ticket.assigned_to : ticket.patient_id;
      if (recipientId) {
        await db.from("notifications").insert({
          user_id: recipientId,
          title: "💬 Nova resposta no ticket",
          message: "Seu ticket de suporte recebeu uma nova resposta.",
          type: "support",
          link: "/dashboard/support",
        });
      }
    }

    return true;
  } catch (err) {
    logError("replyToTicket exception", err);
    return false;
  }
};

/**
 * Close/resolve a ticket.
 */
export const resolveTicket = async (ticketId: string, resolution?: string): Promise<boolean> => {
  try {
    const { error } = await db.from("support_tickets").update({
      status: "resolved",
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any).eq("id", ticketId);

    if (error) return false;

    // Notify patient
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("patient_id, subject")
      .eq("id", ticketId)
      .single();

    if (ticket?.patient_id) {
      await db.from("notifications").insert({
        user_id: ticket.patient_id,
        title: "✅ Ticket resolvido",
        message: `Seu ticket "${ticket.subject}" foi resolvido.`,
        type: "support",
        link: "/dashboard/support",
      });
    }

    return true;
  } catch (err) {
    logError("resolveTicket failed", err);
    return false;
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Auto-infer priority from category and message content.
 */
const inferPriority = (category: TicketCategory, message: string): TicketPriority => {
  const lower = message.toLowerCase();
  if (category === "complaint") return "high";
  if (lower.includes("urgente") || lower.includes("erro no laudo") || lower.includes("cobrança indevida")) return "critical";
  if (category === "payment" || lower.includes("reembolso")) return "high";
  if (category === "report") return "medium";
  return "medium";
};
