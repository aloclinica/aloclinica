# Setup do Mercado Pago Marketplace — checklist operacional

Para ativar o **split automático 90/10** (médico recebe direto na conta dele, plataforma fica com 10% como `marketplace_fee`).

**Tempo total estimado:** 15–20 minutos
**Resultado:** dispensa o cron de repasse para médicos conectados.

---

## ☑️ 1. Criar aplicação Marketplace no Mercado Pago

1. Acesse **https://www.mercadopago.com.br/developers/panel**.
2. Login com a conta MP da AloClínica (a conta da plataforma — não a de um médico).
3. Clique em **"Suas integrações"** → **"Criar aplicação"**.
4. Preencha:
   - **Nome da aplicação**: `AloClinica Marketplace`
   - **Modelo de negócio**: `Marketplace / Plataforma`
   - **Produto Mercado Pago**: `Pagamentos online e presenciais`
   - **Você integra**: `Sim, em nome de terceiros (Marketplace)`
5. Aceite os termos.

## ☑️ 2. Configurar URLs

Dentro da aplicação criada, em **"Configurações da aplicação"**:

| Campo | Valor |
|---|---|
| **Redirect URI** | `https://pwxvvimdtmvziynbspgx.supabase.co/functions/v1/mp-oauth-callback` |
| **Notification URL** (Webhook) | `https://pwxvvimdtmvziynbspgx.supabase.co/functions/v1/mercadopago-webhook` |
| **Eventos do webhook** | `payment`, `merchant_order`, `subscription_preapproval`, `subscription_authorized_payment` |

## ☑️ 3. Coletar credenciais

Em **"Credenciais"** → **"Credenciais de produção"** anote 3 valores:

- **APP_ID** (também chamado de `client_id`) — número inteiro
- **Client Secret** — string longa começando com `client_secret_...`
- **Access Token** — apenas para confirmar se já está configurado (deve ser o que já existe)

## ☑️ 4. Setar os secrets na plataforma

### 4.1. Edge Function Secrets (backend)

Via painel Supabase ou via Management API:

```bash
node -e "
const https=require('https');
const TOKEN=process.env.SUPABASE_ACCESS_TOKEN;  // export antes: SUPABASE_ACCESS_TOKEN='sbp_...'
const body=JSON.stringify([
  { name: 'MERCADOPAGO_APP_ID', value: 'COLE_AQUI_O_APP_ID' },
  { name: 'MERCADOPAGO_CLIENT_SECRET', value: 'COLE_AQUI_O_CLIENT_SECRET' }
]);
https.request('https://api.supabase.com/v1/projects/pwxvvimdtmvziynbspgx/secrets',
  {method:'POST',headers:{'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},
  r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(r.statusCode,d));}
).end(body);
"
```

### 4.2. GitHub Secrets (frontend build)

No repositório GitHub → **Settings → Secrets and variables → Actions**:

| Nome | Valor |
|---|---|
| `VITE_MP_APP_ID` | mesmo APP_ID do passo anterior |

Próximo push em `main` já incluirá esse valor no bundle (lido em `UserProfile.tsx`).

## ☑️ 5. Forçar redeploy

Após os 3 secrets serem setados:

```bash
gh workflow run "Deploy to Production"
```

Aguarde ~2 min para os deploys subirem.

## ☑️ 6. Smoke test

1. Entre no painel de qualquer médico aprovado.
2. Vá em **Perfil → Recebimento Mercado Pago**.
3. O card deve mostrar **"Conectar Mercado Pago"** (não mais a mensagem "administrador precisa configurar").
4. Clicar leva para `auth.mercadopago.com.br/authorization?...` (página de autorização do MP).

## ☑️ 7. Onboarding do primeiro médico

1. Médico clica **"Conectar Mercado Pago"** → autoriza no MP.
2. MP redireciona para `mp-oauth-callback` → salva tokens em `doctor_profiles.mp_*`.
3. Médico volta ao painel com toast verde "Conta conectada ✅".
4. A partir daí, **todo pagamento de consulta com esse médico** vai direto para a conta MP dele (90%) e os 10% caem na conta da plataforma como `marketplace_fee`.

---

## 🔍 Como verificar se está funcionando

Após um pagamento real:

```sql
-- O médico deve ter mp_user_id preenchido
SELECT user_id, mp_user_id, mp_connected_at FROM public.doctor_profiles WHERE mp_user_id IS NOT NULL;

-- A transação deve ter marketplace_fee
SELECT mp_payment_id, raw_response->>'marketplace_fee', raw_response->>'collector_id'
FROM public.payment_transactions
ORDER BY created_at DESC LIMIT 5;
```

`collector_id` deve ser o `mp_user_id` do médico (não o da plataforma). `marketplace_fee` deve ser ~10% do valor.

---

## ⚠️ Importante

- **Médicos não conectados** continuam recebendo via fluxo legado (plataforma recebe 100%, repasse via `auto-payout-tick` → `withdrawal_requests`). **Os dois mundos coexistem.**
- **KYC do médico**: o próprio Mercado Pago exige no OAuth. Não precisamos coletar nada além do que já está na plataforma.
- **Estorno**: se um pagamento for reembolsado, o MP devolve proporcionalmente da conta do médico e da plataforma.

---

## 🆘 Troubleshooting

**Médico clica "Conectar" e dá erro `client_id invalid`** → APP_ID errado nos secrets. Confira em production credentials.

**Webhook não chega** → Confira em `mp-oauth-callback` logs do Supabase. URL no painel MP deve ser **exatamente** a do passo 2.

**Pagamento sem `marketplace_fee`** → médico ainda não conectou MP (sem tokens em `doctor_profiles`). Fluxo legado está sendo usado.

---

**Última atualização:** 2026-05-29 — versão do código suportada: `666b8907`.
