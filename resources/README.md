# resources/ — fontes de ícone e splash (Capacitor Assets)

Coloque aqui os arquivos-fonte e rode `npx @capacitor/assets generate`.

## Arquivos esperados
| Arquivo | Tamanho | Observações |
|---|---|---|
| `icon.png` | 1024×1024 | **Sem transparência** (Apple rejeita alfa). Logo AloClínica centralizada, margem de segurança ~10%. |
| `splash.png` | 2732×2732 | Logo centralizada em fundo `#1a6fc4`. A área central segura é ~1200×1200 (o resto pode ser cortado em telas diferentes). |
| `splash-dark.png` | 2732×2732 | Opcional (tema escuro). |

## Gerar
```bash
npm i -D @capacitor/assets
npx @capacitor/assets generate \
  --iconBackgroundColor '#1a6fc4' \
  --iconBackgroundColorDark '#0f172a' \
  --splashBackgroundColor '#1a6fc4' \
  --splashBackgroundColorDark '#0f172a'
npx cap sync
```
Isso preenche `android/app/src/main/res/**` e `ios/App/App/Assets.xcassets/**`
com todos os tamanhos (adaptive icons Android incluídos).

## Cor da marca
- Primária: `#1a6fc4` (azul AloClínica — mesma do splash/status bar no `capacitor.config.ts`)
- Escuro: `#0f172a`
