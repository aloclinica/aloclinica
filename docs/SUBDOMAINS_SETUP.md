# Fazer os subdomínios de tenant funcionarem

Objetivo: `prefeitura-x.aloclinica.com.br` (e domínio próprio `saude.prefeitura-x.gov.br`)
abrir a plataforma com o branding do contrato e agendamento custeado.

O **app já está pronto** (catch-all serve o SPA; `ContratoContext` resolve o
subdomínio via `resolve_tenant`; CSP libera o Supabase por URL). Faltam só
infra + dados. Siga na ordem.

## 0. Pré-requisitos no app (uma vez)
- [ ] Aplicar a migration `20260527000000_contratos_glue.sql` (`supabase db push`) — cria `resolve_tenant`, `dominio_proprio`, elegibilidade/consumo.
- [ ] Deploy da edge function `contrato-checkout`.
- [ ] Deploy do frontend desta branch (tem `ContratoContext` usando `resolve_tenant`).

## 1. Diagnóstico — o wildcard já existe?
Como `paciente.`/`medico.` já funcionam, o wildcard pode já estar configurado.
Teste um subdomínio inexistente:
```
curl -I https://teste-aleatorio-123.aloclinica.com.br
```
- **200 + HTML** → o wildcard (DNS+TLS+Traefik) JÁ serve tudo. Pule para o passo 4.
- **erro de TLS / DNS / 404 do Traefik** → o roteamento é por host explícito; faça os passos 2–3.

## 2. DNS (wildcard)
No painel DNS de `aloclinica.com.br`:
```
*.aloclinica.com.br   A   72.62.138.208     (mesmo IP do apex)
```
(Confirme que `aloclinica.com.br` e `www` já apontam para esse IP.)

## 3. Traefik (Easypanel — file config, NÃO labels)
No dynamic file config do Traefik no servidor, garanta um router **wildcard**
apontando para o serviço `aloclinica-web` (rede `easypanel`) e TLS wildcard:
```yaml
http:
  routers:
    aloclinica-wildcard:
      rule: "HostRegexp(`{sub:[a-z0-9-]+}.aloclinica.com.br`)"
      entryPoints: ["websecure"]
      service: aloclinica-web
      tls:
        certResolver: letsencrypt   # precisa DNS-01 para wildcard (ver abaixo)
  services:
    aloclinica-web:
      loadBalancer:
        servers:
          - url: "http://aloclinica-web:80"
```
**TLS wildcard** (`*.aloclinica.com.br`) exige **DNS-01** (HTTP-01 não emite wildcard).
No static config do Traefik, o certResolver `letsencrypt` precisa de um provedor DNS:
```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@aloclinica.com.br
      storage: /letsencrypt/acme.json
      dnsChallenge:
        provider: cloudflare   # ou o provedor do seu DNS
```
e as credenciais do provedor como env do container Traefik (ex.: `CF_DNS_API_TOKEN`).
> Se preferir não usar DNS-01, emita um certificado wildcard manualmente e referencie em `tls.certificates`.

## 4. Criar o contrato (dados)
No admin → **Contratos & Ações** → criar contrato:
- `subdominio` = `prefeitura-x` (sem pontos), `status` = ativo
- `branding` (jsonb) com, ex.: `{"logo_url":"https://…","nome_exibicao":"Saúde Prefeitura X","primary_hsl":"210 90% 45%"}`
- beneficiários (CPF) e/ou vouchers conforme o caso
- (domínio próprio) preencher `dominio_proprio` = `saude.prefeitura-x.gov.br` e pedir ao órgão um CNAME → `aloclinica.com.br` (ou A → 72.62.138.208) + incluir esse host no router/cert do Traefik.

## 5. Verificar
```
# resolve_tenant deve retornar o contrato:
curl -s "https://pwxvvimdtmvziynbspgx.supabase.co/rest/v1/rpc/resolve_tenant" \
  -H "apikey: <ANON>" -H "Content-Type: application/json" \
  -d '{"p_host":"prefeitura-x.aloclinica.com.br","p_slug":null}'
```
Abra `https://prefeitura-x.aloclinica.com.br` → deve aparecer o branding (logo/título)
e, ao agendar, pular o Mercado Pago (consulta coberta pelo contrato).

## Testar SEM DNS (agora)
- **Path:** `https://aloclinica.com.br/p/prefeitura-x` — o `ContratoContext` já resolve por path. Funciona sem subdomínio.
- **Local:** adicione no `hosts` `127.0.0.1 prefeitura-x.localhost` e rode `npm run dev` (em local o resolve só ocorre via `/p/:slug`).

## Atenção (segurança)
Hoje o CORS das edge functions é `*` (subdomínios funcionam). Se aplicar a allowlist
do branch `security/hardening-prod`, inclua `https://*.aloclinica.com.br` (e os domínios
próprios cadastrados) na origem permitida, senão os subdomínios param de chamar as funções.
