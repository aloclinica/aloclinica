import { useEffect } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";

const SITE_TITLE = "AloClinica";

/**
 * Updates the document title with unread notification count.
 * e.g. "(3) AloClinica" when there are 3 unread notifications.
 * Place inside AuthProvider.
 */
const useNotificationTitle = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const updateTitle = async () => {
      const { count } = await db
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (!mounted) return;

      const base = document.title.replace(/^\(\d+\)\s*/, "");
      document.title = count && count > 0 ? `(${count}) ${base}` : base;
    };

    updateTitle();

    // Listen for changes — unique channel name per mount to avoid
    // "cannot add postgres_changes after subscribe()" in StrictMode/HMR
    const channelName = `title-badge:${user.id}:${Math.random().toString(36).slice(2, 8)}`;
    const channel = db
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => updateTitle()
      )
      .subscribe();

    return () => {
      mounted = false;
      db.removeChannel(channel);
    };
  }, [user]);
};

export default useNotificationTitle;
