-- MEMED integration: store the Memed prescription identifier ("número da
-- prescrição") on our prescriptions record so we can correlate the
-- `prescricaoExcluida` webhook/event back to the exact row and mark it as
-- deleted (status='deleted', pdf_url cleared).
ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS memed_prescription_id text;

-- Speed up correlation lookups on deletion.
CREATE INDEX IF NOT EXISTS prescriptions_memed_prescription_id_idx
  ON public.prescriptions (memed_prescription_id);
