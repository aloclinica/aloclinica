-- Departamentos por contrato (B2B): permite que uma empresa/órgão controle
-- cota e consumo por unidade interna (RH, TI, Manutenção, etc.).

CREATE TABLE IF NOT EXISTS public.contrato_departamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cota_total integer,
  cota_utilizada integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contrato_departamentos_contrato
  ON public.contrato_departamentos(contrato_id);

ALTER TABLE public.contrato_departamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin or clinic manages departments" ON public.contrato_departamentos;
CREATE POLICY "admin or clinic manages departments" ON public.contrato_departamentos
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'clinic'::public.app_role)
    OR public.has_role(auth.uid(), 'partner'::public.app_role)
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'clinic'::public.app_role)
    OR public.has_role(auth.uid(), 'partner'::public.app_role)
  );

-- Vínculo do beneficiário a um departamento (opcional)
ALTER TABLE public.contrato_beneficiarios
  ADD COLUMN IF NOT EXISTS departamento_id uuid REFERENCES public.contrato_departamentos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contrato_beneficiarios_departamento
  ON public.contrato_beneficiarios(departamento_id) WHERE departamento_id IS NOT NULL;

-- Trigger: ao consumir uma consulta do contrato, incrementa cota_utilizada do
-- departamento do beneficiário (se houver).
CREATE OR REPLACE FUNCTION public.fn_dept_increment_quota()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  dept_id uuid;
BEGIN
  IF NEW.beneficiario_id IS NULL THEN RETURN NEW; END IF;
  SELECT departamento_id INTO dept_id
    FROM public.contrato_beneficiarios WHERE id = NEW.beneficiario_id;
  IF dept_id IS NULL THEN RETURN NEW; END IF;
  UPDATE public.contrato_departamentos
    SET cota_utilizada = cota_utilizada + 1
    WHERE id = dept_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dept_increment_quota ON public.consulta_contrato;
CREATE TRIGGER trg_dept_increment_quota
  AFTER INSERT ON public.consulta_contrato
  FOR EACH ROW EXECUTE FUNCTION public.fn_dept_increment_quota();

NOTIFY pgrst, 'reload schema';
