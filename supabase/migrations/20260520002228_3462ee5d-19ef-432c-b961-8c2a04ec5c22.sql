CREATE OR REPLACE FUNCTION public.fn_sync_cartao_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'cartao_beneficios'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status <> 'active' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.pingo_card_subscriptions
      WHERE user_id = NEW.user_id AND status = 'active' AND id <> NEW.id
    ) THEN
      DELETE FROM public.user_roles
      WHERE user_id = NEW.user_id AND role = 'cartao_beneficios'::app_role;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_cartao_role ON public.pingo_card_subscriptions;
CREATE TRIGGER trg_sync_cartao_role
  AFTER INSERT OR UPDATE OF status ON public.pingo_card_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_cartao_role();

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'cartao_beneficios'::app_role
FROM public.pingo_card_subscriptions
WHERE status = 'active'
ON CONFLICT (user_id, role) DO NOTHING;