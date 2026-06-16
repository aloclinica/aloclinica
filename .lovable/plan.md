## Studio Unificado — Plano de Reescrita

Substitui os 3 editores atuais (`AdminSiteConfig`, `AdminFullSiteEditor`, `AdminPageBuilder`) por um **Studio** único em `/dashboard/admin/studio` com:

- Sidebar de seções/páginas
- Preview ao vivo lado-a-lado (mobile/tablet/desktop)
- Rascunho ↔ publicado
- Versionamento com rollback
- i18n (pt-BR / en / es) por seção
- Logs de auditoria automáticos
- Tema global (cores, fontes, logo, favicon)
- Biblioteca de mídia integrada

Os 3 editores antigos continuam acessíveis durante a transição; o novo `/studio` vira o item principal do nav admin.

---

### Wave 1 — Fundação de dados (1 migration)

Tabela única `site_blocks` (substitui na prática `site_sections` + `site_config` + `custom_pages`):

```text
site_blocks
├─ id, scope ('section' | 'page' | 'config' | 'theme')
├─ page_slug              (null para sections globais)
├─ block_key              (ex.: 'hero', 'faq', 'footer_links')
├─ display_order, parent_id, is_enabled
├─ schema   jsonb         (formato dos campos editáveis)
├─ published jsonb        (vigente público)
├─ draft     jsonb        (rascunho — não publicado)
├─ has_draft bool
├─ i18n      jsonb        ({ "pt-BR": {...}, "en": {...}, "es": {...} })
├─ last_published_at, last_published_by
└─ created_at, updated_at
```

Tabela `site_block_versions` (histórico imutável):
```text
id, block_id, version, snapshot jsonb, locale,
published_at, published_by, change_note
```

Tabela `site_themes` (1 ativo por vez, igual a `legal_documents`):
```text
id, name, tokens jsonb (cores, fontes, radii, spacing), is_active,
logo_url, favicon_url, og_image_url, created_at
```

Migração `site_blocks_seed.sql` copia `site_sections` + `site_config` + páginas custom → `site_blocks` mantendo chaves atuais. Os hooks `useSiteSections`/`useSiteConfig` ganham um adapter que lê `published` de `site_blocks` para zero quebra no público.

RLS: leitura pública só do `published`; mutações apenas para `admin`. Trigger registra cada `UPDATE`/publish em `activity_logs` (auditoria automática).

### Wave 2 — Edge function `studio-publish`

Encapsula a transição draft → published com:
- Cria `site_block_versions` (snapshot, locale, autor, change_note)
- Copia `draft → published`, zera `has_draft`, seta `last_published_at/by`
- Invalida cache (`invalidateSiteSections` + broadcast Realtime para preview)
- Roda em transação; aborta se outra publicação simultânea está em curso

Endpoints: `publish_block(id, locale?)`, `publish_all_drafts()`, `rollback_to(version_id)`.

### Wave 3 — Studio frontend (`/dashboard/admin/studio`)

Layout em 3 colunas:

```text
┌────────────┬────────────────────┬───────────────────┐
│ Sidebar    │ Editor de campos   │ Preview ao vivo   │
│ - Páginas  │ (gerado do schema) │ (iframe da rota)  │
│ - Seções   │                    │ ─ mobile/tablet/  │
│ - Tema     │                    │   desktop toggle  │
│ - Mídia    │                    │                   │
└────────────┴────────────────────┴───────────────────┘
```

Componentes novos:
- `src/components/admin/studio/StudioLayout.tsx` — shell de 3 colunas, atalhos `⌘S` salvar rascunho, `⌘⇧P` publicar.
- `StudioSidebar.tsx` — árvore de páginas + seções, drag-and-drop (`@dnd-kit/sortable` já no projeto), badge "rascunho" amarela, "oculta" cinza.
- `BlockFieldsForm.tsx` — gera form a partir do `schema` JSONB. Tipos: text, textarea, richtext (Tiptap já existe), image (abre MediaPicker), color, number, select, list (array de objetos para FAQ/depoimentos/planos).
- `LivePreviewIframe.tsx` — iframe da rota correspondente com `?draft=1&token=…`; recebe `postMessage` a cada keystroke (debounce 400 ms) e re-renderiza só o bloco editado via Context.
- `LocaleSwitcher.tsx` — pt-BR / en / es; lê/grava em `i18n[locale]` mantendo `published` como fallback.
- `VersionHistoryDrawer.tsx` — lista `site_block_versions`, diff visual (json-diff renderizado), botão "Restaurar esta versão".
- `ThemeEditor.tsx` — paleta (color pickers HSL), fontes (combobox de Google Fonts já carregadas), logo/favicon upload; preview aplica via CSS vars.
- `MediaLibrary.tsx` — Supabase Storage bucket `site-media`, busca, upload com crop, alt text obrigatório.

Lado público: `useSiteSections` + landing components passam a aceitar um modo "draft preview" (querystring `?preview=draft&token=…` validado por edge function `preview-token`) — assim o iframe mostra exatamente o que está sendo editado, sem publicar.

### Wave 4 — Sincronizar 100% das seções públicas

Inventário e registro como `site_blocks` editáveis:

| Página | Seções |
|---|---|
| `/` | hero, busca, especialidades, comparativo, depoimentos, FAQ, CTA, footer |
| `/sobre`, `/para-empresas`, `/para-profissionais`, `/contato`, `/ajuda`, `/recursos`, `/servicos`, `/como-funciona`, `/seguranca`, `/lgpd`, `/cookies`, `/privacidade`, `/termos`, `/refund-policy` | hero + body blocks |
| `/especialidades`, `/especialidades/:slug` | metadados editáveis por especialidade (já em `specialties`, ganhar campo `landing_md`) |
| Email templates (`notification_templates`) | tab dedicada no Studio |

Cada componente público passa a ler `useBlock(pageSlug, blockKey)` em vez de strings hardcoded. Onde existir hardcode, é movido para `published.default` no seed para preservar o conteúdo atual.

### Wave 5 — Auditoria + nav cleanup

- Triggers de banco gravam `activity_logs(action='site_block.update'|'.publish'|'.rollback', metadata={block, version, locale, diff_summary})`.
- Tab "Histórico" no Studio mostra logs filtráveis por usuário/data/bloco.
- `adminNav.tsx` ganha "Studio" como item principal de Conteúdo; "Site Editor", "Site Config" e "Páginas Custom" viram itens secundários "(legado)" para evitar quebra durante rollout. Removidos numa wave futura quando o time confirmar paridade.

### Detalhes técnicos

- **DB client**: `db` (untyped) em tudo (memória `untyped-db-client-migration`).
- **Realtime**: `supabase_realtime` em `site_blocks` para sincronizar múltiplos editores abertos + push para o iframe de preview.
- **CFM/LGPD**: `site_block_versions` é imutável (trigger `_block_mutation`). `activity_logs` cobre auditoria humana.
- **Performance**: bulk fetch de `site_blocks WHERE scope='section'` em 1 query, cache em memória (`invalidateSiteSections` continua valendo).
- **Compatibilidade**: enquanto o seed roda, `useSiteSections` lê do nome novo e do antigo; após migration verde, `site_sections`/`site_config` ficam como views read-only que apontam para `site_blocks`.

### Fora de escopo (próxima rodada)
- A/B testing por bloco
- Agendamento de publicação ("publicar em 1h")
- Editor WYSIWYG drag-and-drop tipo Webflow (mantemos forms gerados do schema)
- Roles intermediários (editor vs publisher)
- SSO / colaboração simultânea com locks por seção

---

**Ordem de execução**: Wave 1 → 2 → 3 → 4 → 5, em commits separados. Cada wave deixa o sistema funcional e o público intacto. Posso começar pela Wave 1 (migration única) assim que aprovado.