# Melhoria do cadastro de médico

Transformar `/medico/cadastro` num wizard de 3 etapas com convite obrigatório, validação automática de CRM (CFM) e upload de documentos já na inscrição.

## Fluxo final

```
[1] Convite + Email   →   [2] Dados + CRM (auto-valida)   →   [3] Documentos + Senha   →   Aguardando aprovação
```

- **Passo 1** — código de convite + e-mail. Valida em RPC `validate_doctor_invite` (existe, não usado, não expirado, e-mail bate).
- **Passo 2** — nome, CPF, telefone, CRM + UF, especialidade. Botão "Validar CRM" chama edge function `validate-crm` que consulta o portal do CFM e retorna nome + situação ("Ativo"). Se confere, marca verde e libera passo 3.
- **Passo 3** — upload de: foto do CRM, RG/CNH (frente), selfie segurando documento. Senha forte. No submit: signUp → signIn → insert `doctor_profiles` → upload no bucket privado `doctor-documents` → consome convite → redireciona para `/aguardando-aprovacao?role=doctor`.

## Mudanças no banco

Migration nova:

- `doctor_invites` (code unique, email, expires_at, used_at, used_by, created_by, notes).
- RPCs `SECURITY DEFINER`:
  - `validate_doctor_invite(p_code text, p_email text) → boolean` — valida sem consumir.
  - `consume_doctor_invite(p_code text, p_user_id uuid)` — marca como usado.
  - `admin_create_doctor_invite(p_email text, p_expires_days int default 30)` — gera código aleatório (admin only).
- Bucket `doctor-documents` (privado) + policies em `storage.objects` (médico só insere/lê pasta `{auth.uid()}/...`; admin lê tudo).
- Coluna nova em `doctor_profiles`: `documents jsonb` (URLs dos arquivos enviados).

## Edge function

`validate-crm`:
- Input: `{ crm, uf }`
- Tenta `https://portal.cfm.org.br/api_rest_php/api/v1/medico/buscar_medicos` (POST form-encoded). Retorna `{ ok, name, situation, source }`.
- Se CFM indisponível retorna `{ ok: false, fallback: true }` e o front permite continuar com `crm_verified=false`.

## Frontend

Reescrever `src/pages/SignupDoctor.tsx`:
- Componente `DoctorSignupWizard` com `step` 1/2/3, barra de progresso, validação por etapa, animação `motion`.
- Novo componente `DoctorDocumentsUpload` reutilizável (3 dropzones).
- Mantém painel lateral atual com benefícios.
- Mantém uso do cliente `db` (untyped) conforme regra do projeto.

## Detalhes técnicos

- Geração de código de convite: `encode(gen_random_bytes(6), 'hex')` em uppercase (12 chars).
- Validações zod no client + checagem server-side via RPC.
- Upload usa `db.storage.from('doctor-documents').upload(\`${userId}/crm.jpg\`, file, { upsert: true })`.
- Convite é marcado como `used_at = now()` somente após sucesso completo.
- `signup_doctor_requires_invite` em `site_config` passa a ser respeitado (já era `true`).
- Admin pode gerar códigos via SQL: `select admin_create_doctor_invite('medico@x.com', 30);` (UI admin fica para próxima iteração).

## Fora de escopo

- UI admin para gerenciar convites (deferida).
- Verificação biométrica/CompreFace continua acontecendo depois, no `/kyc`.
