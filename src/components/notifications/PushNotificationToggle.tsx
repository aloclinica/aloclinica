import { logError } from "@/lib/logger";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { ensurePushServiceWorkerRegistration } from "@/lib/push-service-worker";

const PushNotificationToggle = () => {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      setSupported(true);

      const reg = await ensurePushServiceWorkerRegistration();
      if (!reg) return;

      const sub = await (reg as ServiceWorkerRegistration & { pushManager: PushManager }).pushManager.getSubscription();
      if (sub) setSubscribed(true);
    };

    void check();
  }, []);

  const subscribe = async () => {
    if (!user || loading) return;
    setLoading(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permissão de notificações negada");
        setLoading(false);
        return;
      }

      const reg = await ensurePushServiceWorkerRegistration();
      if (!reg) throw new Error("Push service worker indisponível");

      const sub = await (reg as ServiceWorkerRegistration & { pushManager: PushManager }).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: "BAcxZjzip4n-k1ifUoCKTHN8s2fo9woakP0bT1_2bim88q4vvDDFhrm5Ydg2Q_dg8-paX0lg39E6fq0KysNKkmg",
      });

      const json = sub.toJSON();
      await db.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: json.endpoint!,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      }, { onConflict: "user_id,endpoint" });

      setSubscribed(true);
      toast.success("Notificações ativadas!");
    } catch (err: unknown) {
      logError("Push subscription error", err);
      toast.error("Erro ao ativar notificações. Tente novamente.");
    }
    setLoading(false);
  };

  const unsubscribe = async () => {
    if (!user || loading) return;
    setLoading(true);

    try {
      const reg = await ensurePushServiceWorkerRegistration();
      const sub = await (reg as ServiceWorkerRegistration & { pushManager: PushManager }).pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await db.from("push_subscriptions").delete()
          .eq("user_id", user.id)
          .eq("endpoint", sub.endpoint);
      }
      setSubscribed(false);
      toast.success("Notificações desativadas");
    } catch (err) {
      logError("Push unsubscribe error", err);
    }
    setLoading(false);
  };

  if (!supported || !user) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      className="text-xs"
    >
      {subscribed ? (
        <><BellOff className="w-3 h-3 mr-1" /> Desativar Push</>
      ) : (
        <><Bell className="w-3 h-3 mr-1" /> Ativar Push</>
      )}
    </Button>
  );
};

export default PushNotificationToggle;
