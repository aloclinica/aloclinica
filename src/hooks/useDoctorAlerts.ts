import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { PINGO_LOGO_URL } from "@/lib/constants";
import { logError } from "@/lib/logger";

// Statuses that signal a patient has entered / checked in to the waiting room.
// The waiting room itself uses the `appointments` table with status "waiting"
// as the "patient entered" signal (see DoctorWaitingRoom.tsx), so we reuse it.
const ARRIVAL_STATUSES = ["waiting"];

const fireBrowserNotification = (title: string, body: string) => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    new Notification(title, { body, icon: PINGO_LOGO_URL, tag: "aloclinica-doctor-alert" });
  } catch {
    /* Notification API can throw on some platforms — never break the app */
  }
};

/**
 * App-wide doctor alerts. Mount ONCE in the doctor shell (DashboardLayout,
 * gated on the doctor role) so it runs across every doctor screen — not just
 * while the waiting room is open.
 *
 * It resolves the logged-in user's doctor_profile id and subscribes to this
 * doctor's `appointments` via Supabase realtime. On a patient arrival
 * (status -> "waiting") or a new booking (INSERT) it fires a sonner toast and
 * a browser Notification, and bumps `pendingCount` for a nav badge.
 *
 * DoctorWaitingRoom keeps its own local handler; to avoid double-alerting,
 * global toasts/notifications are suppressed while the doctor is actually
 * viewing the waiting-room route (that screen already alerts locally).
 */
export const useDoctorAlerts = (enabled: boolean) => {
  const { user } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  // The realtime callback is created once per subscription, so route state and
  // recently-handled events are read through refs to stay current.
  const onWaitingRoomRef = useRef(false);
  const handledRef = useRef<Set<string>>(new Set());

  const onWaitingRoom = location.pathname.includes("waiting-room");
  useEffect(() => {
    onWaitingRoomRef.current = onWaitingRoom;
  }, [onWaitingRoom]);

  // Clear the badge once the doctor opens the waiting room (they're now looking).
  useEffect(() => {
    if (onWaitingRoom) setPendingCount(0);
  }, [onWaitingRoom]);

  const clearPending = useCallback(() => setPendingCount(0), []);

  // Ask for Notification permission a single time when alerts turn on.
  useEffect(() => {
    if (!enabled) return;
    try {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    } catch {
      /* ignore unsupported environments */
    }
  }, [enabled]);

  // Resolve the doctor_profile id for the logged-in user.
  useEffect(() => {
    if (!enabled || !user?.id) {
      setDoctorId(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const { data } = await db
          .from("doctor_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (active) setDoctorId((data as { id?: string } | null)?.id ?? null);
      } catch (error) {
        logError("useDoctorAlerts: failed to resolve doctor profile", error);
        if (active) setDoctorId(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [enabled, user?.id]);

  // Subscribe to this doctor's appointments and alert on arrivals / new bookings.
  useEffect(() => {
    if (!enabled || !doctorId) return;

    let channel: ReturnType<typeof db.channel> | null = null;
    try {
      channel = db
        .channel(`doctor-alerts-${doctorId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "appointments",
            filter: `doctor_id=eq.${doctorId}`,
          },
          (payload: {
            eventType?: string;
            new?: { id?: string; status?: string } | null;
            old?: { status?: string } | null;
          }) => {
            try {
              const eventType = payload.eventType;
              const next = payload.new ?? undefined;
              const prev = payload.old ?? undefined;
              const apptId = next?.id ?? "";

              // A patient entered the waiting room (status transitioned to "waiting").
              const becameWaiting =
                eventType === "UPDATE" &&
                ARRIVAL_STATUSES.includes(next?.status ?? "") &&
                next?.status !== prev?.status;

              // A brand-new booking landed on this doctor's schedule.
              const isNewBooking = eventType === "INSERT" && !!next;

              if (!becameWaiting && !isNewBooking) return;

              // Dedupe rapid duplicate events for the same appointment/status.
              const dedupeKey = `${apptId}:${next?.status ?? eventType}`;
              if (apptId && handledRef.current.has(dedupeKey)) return;
              if (apptId) {
                handledRef.current.add(dedupeKey);
                if (handledRef.current.size > 200) handledRef.current.clear();
              }

              // The waiting room screen alerts locally; don't double-alert there.
              if (onWaitingRoomRef.current) return;

              if (becameWaiting) {
                setPendingCount((c) => c + 1);
                toast.success("🔔 Paciente na sala de espera!", {
                  description: "Um paciente entrou na sala de espera virtual.",
                });
                fireBrowserNotification(
                  "Paciente na sala de espera",
                  "Um paciente entrou na sala de espera virtual.",
                );
              } else if (isNewBooking) {
                toast.info("📅 Novo agendamento", {
                  description: "Você recebeu uma nova consulta.",
                });
                fireBrowserNotification(
                  "Novo agendamento",
                  "Você recebeu uma nova consulta.",
                );
              }
            } catch (error) {
              logError("useDoctorAlerts: failed to handle realtime event", error);
            }
          },
        )
        .subscribe();
    } catch (error) {
      logError("useDoctorAlerts: failed to subscribe to appointments", error);
    }

    return () => {
      try {
        if (channel) db.removeChannel(channel);
      } catch {
        /* ignore cleanup errors */
      }
    };
  }, [enabled, doctorId]);

  return { pendingCount, doctorId, clearPending };
};

export default useDoctorAlerts;
