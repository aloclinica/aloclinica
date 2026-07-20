-- FASE 3: preferencias de notificacao na CONTA (nao mais so no localStorage).
-- Assim "silenciar" uma categoria passa a valer em todos os aparelhos E o backend
-- respeita (ex.: whatsapp-notify pula o envio quando a categoria esta desligada).

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own notif prefs" ON public.notification_preferences;
CREATE POLICY "own notif prefs" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- service_role (edge functions) bypassa RLS para ler as preferencias no envio.
