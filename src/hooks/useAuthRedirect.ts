import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { getSubdomainRole } from "./use-subdomain-redirect";

/**
 * Centralized post-login redirect logic.
 * After signInWithPassword succeeds, call redirectAfterLogin(user) 
 * to handle role-based routing.
 * Supports ?redirect= param for post-login deep linking (e.g. KYC from QR code).
 */
export function useAuthRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectAfterLogin = async (userId: string) => {
    const { data: roles } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roleList = roles?.map((r: any) => r.role) ?? [];

    // Check for explicit redirect param (e.g. from QR code KYC)
    const redirectTo = searchParams.get("redirect");
    if (redirectTo && redirectTo.startsWith("/")) {
      navigate(redirectTo);
      return;
    }

    const subRole = getSubdomainRole();
    if (subRole) {
      navigate(`/dashboard?role=${subRole}`);
    } else {
      navigate("/dashboard");
    }
  };

  return { redirectAfterLogin };
}
