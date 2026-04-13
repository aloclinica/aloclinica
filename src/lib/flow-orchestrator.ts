/**
 * Flow Orchestrator - Central coordination for all user flows
 * Manages state transitions, permissions, and notifications across all user types
 */

export type UserRole = "patient" | "doctor" | "clinic" | "laudista" | "oftalmologist" | "admin" | "support" | "receptionist" | "partner";

export type ServiceType = "telemedicina" | "oftalmologia" | "cartao" | "telelaudo";

export interface User {
  id: string;
  role: UserRole;
  service?: ServiceType;
  isApproved?: boolean;
  isActive?: boolean;
}

export interface FlowState {
  user: User;
  currentStep: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Define allowed transitions between states for each user role
 */
const FLOW_TRANSITIONS: Record<UserRole, Record<string, string[]>> = {
  patient: {
    profile_incomplete: ["profile_complete"],
    profile_complete: ["browsing", "onboarding"],
    onboarding: ["ready_to_book"],
    ready_to_book: ["searching", "browsing"],
    searching: ["selecting_doctor"],
    selecting_doctor: ["booking"],
    booking: ["confirming", "payment"],
    payment: ["waiting_confirmation"],
    waiting_confirmation: ["appointment_confirmed", "payment_failed"],
    appointment_confirmed: ["waiting_for_consultation", "cancelled"],
    waiting_for_consultation: ["in_consultation"],
    in_consultation: ["consultation_finished"],
    consultation_finished: ["rating", "health_records"],
    rating: ["completed"],
    completed: ["browsing", "ready_to_book"],
  },

  doctor: {
    pending_approval: ["approved", "rejected"],
    approved: ["profile_setup"],
    profile_setup: ["availability_setup"],
    availability_setup: ["ready_for_consultation"],
    ready_for_consultation: ["online", "offline"],
    online: ["waiting_for_patient", "offline"],
    waiting_for_patient: ["in_consultation"],
    in_consultation: ["prescription", "finishing"],
    prescription: ["finishing"],
    finishing: ["completed"],
    completed: ["online", "offline"],
    offline: ["online"],
  },

  clinic: {
    pending_approval: ["approved", "rejected"],
    approved: ["profile_setup"],
    profile_setup: ["ready_to_send"],
    ready_to_send: ["sending_exam"],
    sending_exam: ["exam_sent"],
    exam_sent: ["waiting_laudo"],
    waiting_laudo: ["laudo_received"],
    laudo_received: ["distributing"],
    distributing: ["completed"],
    completed: ["sending_exam"],
  },

  laudista: {
    pending_approval: ["approved", "rejected"],
    approved: ["profile_setup"],
    profile_setup: ["ready_for_analysis"],
    ready_for_analysis: ["analyzing"],
    analyzing: ["reviewing"],
    reviewing: ["signing"],
    signing: ["completed"],
    completed: ["ready_for_analysis"],
  },

  oftalmologist: {
    pending_approval: ["approved", "rejected"],
    approved: ["profile_setup"],
    profile_setup: ["ready_for_examination"],
    ready_for_examination: ["examining"],
    examining: ["prescribing"],
    prescribing: ["signing"],
    signing: ["completed"],
    completed: ["ready_for_examination"],
  },

  admin: {
    approved: ["managing"],
    managing: ["reviewing", "approving", "rejecting", "configuring"],
    reviewing: ["managing"],
    approving: ["managing"],
    rejecting: ["managing"],
    configuring: ["managing"],
  },

  support: {
    approved: ["supporting"],
    supporting: ["chatting", "ticketing", "escalating"],
    chatting: ["supporting"],
    ticketing: ["supporting"],
    escalating: ["supporting"],
  },

  receptionist: {
    approved: ["checking_in"],
    checking_in: ["managing_queue"],
    managing_queue: ["calling", "finalizing"],
    calling: ["managing_queue"],
    finalizing: ["checking_in"],
  },

  partner: {
    approved: ["referring"],
    referring: ["tracking"],
    tracking: ["withdrawing", "referring"],
    withdrawing: ["referring"],
  },
};

/**
 * Define permissions for each user role
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  patient: [
    "view_profile",
    "edit_profile",
    "search_doctors",
    "book_appointment",
    "view_appointments",
    "view_consultation",
    "rate_doctor",
    "view_prescriptions",
    "view_health_metrics",
    "upload_documents",
    "view_documents",
    "manage_dependents",
    "contact_support",
  ],

  doctor: [
    "view_profile",
    "edit_profile",
    "configure_availability",
    "view_appointments",
    "accept_appointment",
    "reject_appointment",
    "attend_consultation",
    "prescribe",
    "view_patients",
    "view_earnings",
    "view_analytics",
    "manage_availability",
  ],

  clinic: [
    "view_profile",
    "edit_profile",
    "upload_exam",
    "view_exams",
    "track_laudo",
    "view_patients",
    "manage_patients",
    "manage_doctors",
    "view_schedules",
  ],

  laudista: [
    "view_queue",
    "view_exam",
    "analyze_exam",
    "prescribe_laudo",
    "sign_laudo",
    "view_my_laudos",
    "view_earnings",
    "view_analytics",
  ],

  oftalmologist: [
    "view_queue",
    "view_examination",
    "prescribe",
    "sign_prescription",
    "attend_consultation",
    "view_my_exams",
    "view_analytics",
  ],

  admin: [
    "view_dashboard",
    "manage_users",
    "approve_doctors",
    "approve_clinics",
    "approve_laudistas",
    "view_financials",
    "manage_system",
    "view_health",
    "configure_system",
    "impersonate_user",
  ],

  support: [
    "view_inbox",
    "chat_with_users",
    "create_ticket",
    "view_tickets",
    "escalate_issue",
    "configure_chatbot",
    "view_analytics",
  ],

  receptionist: [
    "check_in_patient",
    "manage_queue",
    "call_patient",
    "view_appointments",
    "finalize_appointment",
  ],

  partner: [
    "view_dashboard",
    "share_referral_link",
    "view_referrals",
    "withdraw_earnings",
    "view_analytics",
  ],
};

/**
 * Check if a user can transition from one state to another
 */
export function canTransition(
  role: UserRole,
  fromState: string,
  toState: string
): boolean {
  const transitions = FLOW_TRANSITIONS[role];
  if (!transitions || !transitions[fromState]) {
    return false;
  }
  return transitions[fromState].includes(toState);
}

/**
 * Get allowed next states for a user
 */
export function getAllowedNextStates(role: UserRole, currentState: string): string[] {
  return FLOW_TRANSITIONS[role]?.[currentState] ?? [];
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Define which routes are accessible by each role
 */
const ROLE_ROUTES: Record<UserRole, string[]> = {
  patient: [
    "/dashboard/patient",
    "/dashboard/schedule",
    "/dashboard/appointments",
    "/dashboard/doctor",
    "/dashboard/patient/health",
    "/dashboard/patient/documents",
    "/dashboard/patient/dependents",
    "/dashboard/patient/exam-results",
    "/dashboard/profile",
    "/dashboard/settings",
  ],

  doctor: [
    "/dashboard/doctor",
    "/dashboard/doctor/waiting-room",
    "/dashboard/doctor/calendar",
    "/dashboard/doctor/availability",
    "/dashboard/prescriptions",
    "/dashboard/earnings",
    "/dashboard/doctor/analytics",
    "/dashboard/patients",
    "/dashboard/profile",
    "/dashboard/settings",
  ],

  clinic: [
    "/dashboard/clinic",
    "/clinica/enviar-exame",
    "/clinica/exames",
    "/dashboard/clinic/patients",
    "/dashboard/clinic/schedules",
    "/dashboard/clinic/doctors",
    "/dashboard/profile",
    "/dashboard/settings",
  ],

  laudista: [
    "/dashboard/laudista",
    "/dashboard/laudista/queue",
    "/dashboard/laudista/report-editor",
    "/dashboard/laudista/my-reports",
    "/dashboard/laudista/financeiro",
    "/dashboard/profile",
    "/dashboard/settings",
  ],

  oftalmologist: [
    "/oftalmologista/dashboard",
    "/oftalmologista/consulta",
    "/oftalmologista/consulta/:id/prescricao",
    "/dashboard/profile",
    "/dashboard/settings",
  ],

  admin: [
    "/dashboard/admin",
    "/dashboard/admin/panel-center",
    "/dashboard/admin/approvals",
    "/dashboard/admin/doctors",
    "/dashboard/admin/patients",
    "/dashboard/admin/clinics",
    "/dashboard/admin/financial",
    "/dashboard/admin/health",
    "/dashboard/admin/site-config",
    "/dashboard/admin/live",
    "/dashboard/admin/whatsapp",
  ],

  support: [
    "/dashboard/support",
    "/dashboard/support/inbox",
    "/dashboard/support/chatbot",
    "/dashboard/profile",
    "/dashboard/settings",
  ],

  receptionist: [
    "/dashboard/receptionist",
    "/dashboard/receptionist/patients",
    "/dashboard/receptionist/queue",
    "/dashboard/profile",
    "/dashboard/settings",
  ],

  partner: [
    "/dashboard/partner",
    "/dashboard/partner/referrals",
    "/dashboard/profile",
    "/dashboard/settings",
  ],
};

/**
 * Check if a user can access a route
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  const allowedRoutes = ROLE_ROUTES[role] ?? [];

  // Exact match
  if (allowedRoutes.includes(route)) {
    return true;
  }

  // Wildcard match for dynamic routes
  return allowedRoutes.some(allowedRoute => {
    const pattern = allowedRoute
      .replace(/:[^/]+/g, "[^/]+")
      .replace(/\//g, "\\/");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(route);
  });
}

/**
 * Get all accessible routes for a role
 */
export function getAccessibleRoutes(role: UserRole): string[] {
  return ROLE_ROUTES[role] ?? [];
}

/**
 * Service type requirements for each role
 */
const SERVICE_REQUIREMENTS: Record<UserRole, ServiceType[]> = {
  patient: ["telemedicina", "oftalmologia", "cartao"],
  doctor: ["telemedicina"],
  clinic: ["telelaudo"],
  laudista: ["telelaudo"],
  oftalmologist: ["oftalmologia"],
  admin: [],
  support: [],
  receptionist: [],
  partner: [],
};

/**
 * Check if a user role supports a service type
 */
export function supportsService(role: UserRole, service: ServiceType): boolean {
  const requirements = SERVICE_REQUIREMENTS[role];
  return requirements.length === 0 || requirements.includes(service);
}

/**
 * Get required services for a role
 */
export function getRequiredServices(role: UserRole): ServiceType[] {
  return SERVICE_REQUIREMENTS[role] ?? [];
}

/**
 * Notification configuration for each role
 */
const NOTIFICATION_RULES: Record<UserRole, Record<string, boolean>> = {
  patient: {
    appointment_confirmed: true,
    appointment_reminder: true,
    doctor_joined: true,
    prescription_ready: true,
    support_reply: true,
    payment_confirmed: true,
  },

  doctor: {
    new_appointment: true,
    patient_joined_waiting: true,
    consultation_reminder: true,
    payment_received: true,
    review_received: true,
    system_alert: true,
  },

  clinic: {
    exam_uploaded: true,
    laudo_completed: true,
    patient_message: true,
    system_alert: true,
  },

  laudista: {
    new_exam: true,
    urgent_exam: true,
    exam_expired: true,
    payment_received: true,
    system_alert: true,
  },

  oftalmologist: {
    new_examination: true,
    system_alert: true,
  },

  admin: {
    system_alert: true,
    user_approval_needed: true,
    critical_error: true,
  },

  support: {
    new_ticket: true,
    escalated_issue: true,
    system_alert: true,
  },

  receptionist: {
    new_patient: true,
    patient_waiting: true,
    system_alert: true,
  },

  partner: {
    referral_completed: true,
    earnings_received: true,
    system_alert: true,
  },
};

/**
 * Check if a notification type should be sent to a role
 */
export function shouldNotify(role: UserRole, notificationType: string): boolean {
  return NOTIFICATION_RULES[role]?.[notificationType] ?? false;
}

/**
 * Get all notification types for a role
 */
export function getNotificationRules(role: UserRole): Record<string, boolean> {
  return NOTIFICATION_RULES[role] ?? {};
}

export default {
  canTransition,
  getAllowedNextStates,
  hasPermission,
  getPermissions,
  canAccessRoute,
  getAccessibleRoutes,
  supportsService,
  getRequiredServices,
  shouldNotify,
  getNotificationRules,
};
