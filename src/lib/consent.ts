import { db } from "@/integrations/supabase/untyped";
import { logError } from "@/lib/logger";

export const registerConsent = async (
  userId: string,
  consentType = "terms_and_privacy",
  version = "1.0",
) => {
  try {
    await db.from("user_consents").insert({
      user_id: userId,
      consent_type: consentType,
      version,
      user_agent: navigator.userAgent,
    });
  } catch (err) {
    logError("Failed to register consent", err, { userId, consentType, version });
  }
};
