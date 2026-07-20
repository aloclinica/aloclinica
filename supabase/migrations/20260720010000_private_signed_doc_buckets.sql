-- Sigilo (CFM Art. 3 / LGPD): documentos clínicos assinados não podem ficar em
-- bucket público (path enumerável). Torna privados. Idempotente.
UPDATE storage.buckets SET public = false
 WHERE id IN ('receitas-assinadas', 'laudos-assinados');
