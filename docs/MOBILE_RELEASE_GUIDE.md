# 📱 AloClínica — Guia de Publicação Mobile (Play Store + App Store)

Este guia leva o app do código até as lojas. O app usa **Capacitor** (embrulha a
PWA React/Vite num binário nativo). O `capacitor.config.ts` já está pronto
(`appId: br.com.aloclinica.app`, `appName: AloClínica`).

> **Resumo do que precisa de VOCÊ (não dá pra automatizar):**
> - Conta **Apple Developer** (US$ 99/ano) + um **Mac com Xcode** (obrigatório p/ iOS).
> - Conta **Google Play Console** (US$ 25, pagamento único).
> - Uma logo em alta resolução (mín. 1024×1024 PNG, fundo sólido) para gerar ícones.
> - URLs públicas de **Política de Privacidade** e **Termos** (já existem: /privacy, /terms, /lgpd).

---

## 0. Pré-requisitos (máquina de build)
- Node 18+ e o repositório com `npm install` rodado.
- **Android:** Android Studio (inclui SDK + Gradle + JDK 17).
- **iOS:** macOS + Xcode 15+ e CocoaPods (`sudo gem install cocoapods`). **Não há como gerar/assinar iOS no Windows.** Alternativas se você não tem Mac: um Mac na nuvem (MacinCloud, MacStadium) ou serviço de CI com runner macOS (Codemagic, EAS Build, GitHub Actions `macos-latest`).

## 1. Gerar os projetos nativos
```bash
npm install
npm run build                       # gera dist/
npx cap add android
npx cap add ios                     # só no macOS
npx cap sync
```
Isso cria as pastas `android/` e `ios/` (versionáveis no git, mas pesadas — considere `.gitignore` seletivo).

## 2. Ícones e Splash Screens
Coloque uma logo quadrada de origem e gere todos os tamanhos automaticamente:
```bash
npm i -D @capacitor/assets
# Coloque os arquivos-fonte:
#   resources/icon.png            (1024×1024, sem transparência p/ iOS)
#   resources/splash.png          (2732×2732, logo centralizada em fundo #1a6fc4)
#   resources/splash-dark.png     (opcional, tema escuro)
npx @capacitor/assets generate --iconBackgroundColor '#1a6fc4' --splashBackgroundColor '#1a6fc4'
npx cap sync
```
> A pasta `resources/` com um `README` de especificação já está criada neste repo.

## 3. Permissões nativas (o app usa câmera, microfone, notificações)
O AloClínica faz **teleconsulta (vídeo/áudio)**, **KYC facial (câmera)** e **push**. Declare as permissões, senão a loja reprova ou o recurso quebra:

**Android** — `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```
**iOS** — `ios/App/App/Info.plist` (mensagens em PT-BR, obrigatórias na revisão Apple):
```xml
<key>NSCameraUsageDescription</key>
<string>Usamos a câmera para a videoconsulta e para a verificação de identidade (KYC).</string>
<key>NSMicrophoneUsageDescription</key>
<string>Usamos o microfone durante a sua consulta por vídeo.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Salvamos receitas e atestados na sua galeria quando você solicita.</string>
```

## 4. Deep Links / Universal Links (abrir aloclinica.com.br no app)
- **Android** (App Links): adicionar `assetlinks.json` em `https://aloclinica.com.br/.well-known/assetlinks.json` e um `<intent-filter>` com `android:autoVerify="true"` no manifest.
- **iOS** (Universal Links): adicionar o entitlement `Associated Domains` (`applinks:aloclinica.com.br`) no Xcode e o arquivo `https://aloclinica.com.br/.well-known/apple-app-site-association`.
> Modelos dos dois arquivos `.well-known` estão em `docs/store/`.

## 5. Push Notifications (FCM/APNs)
- **Android:** crie um projeto no **Firebase**, baixe `google-services.json` → `android/app/`. O plugin `@capacitor/push-notifications` já está instalado.
- **iOS:** habilite **Push Notifications** e **Background Modes → Remote notifications** no Xcode; suba a chave APNs no Firebase (se usar FCM) ou configure APNs direto.

## 6. Versionamento
- **Android:** `android/app/build.gradle` → `versionCode` (inteiro, incrementa a cada envio) e `versionName` (ex.: "1.0.0").
- **iOS:** Xcode → target App → `Version` (1.0.0) e `Build` (incrementa a cada envio).

---

## 7. 🤖 Google Play — passo a passo
1. **Play Console → Criar app** → nome "AloClínica", idioma PT-BR, tipo App, gratuito.
2. **Assinatura:** ative o **Play App Signing** (o Google guarda a chave). Gere o upload keystore:
   ```bash
   keytool -genkey -v -keystore aloclinica-upload.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
   Configure em `android/app/build.gradle` (bloco `signingConfigs`) ou via `keystore.properties` (NÃO commitar o keystore).
3. **Gerar o AAB:** Android Studio → *Build → Generate Signed Bundle → Android App Bundle*, ou:
   ```bash
   cd android && ./gradlew bundleRelease
   # saída: android/app/build/outputs/bundle/release/app-release.aab
   ```
4. **Ficha da loja:** use `docs/store/LISTINGS.md` (título, descrições, screenshots).
5. **Data Safety / Política de Privacidade:** preencha com `docs/store/DATA_SAFETY_PRIVACY.md` (o app coleta dados de saúde — declare corretamente).
6. **Content rating**, **público-alvo** (não infantil), **categoria: Medicina**.
7. Suba o `.aab` em **Testes internos** primeiro → depois **Produção**. Revisão do Google: ~1–7 dias. Apps de saúde podem pedir declaração extra ("App de saúde/telemedicina" — anexe registro CNPJ/responsável técnico).

## 8. 🍎 Apple App Store — passo a passo (requer Mac)
1. **App Store Connect → Meus Apps → +** → Bundle ID `br.com.aloclinica.app` (registre antes em *Certificates, Identifiers & Profiles*).
2. **Assinatura:** deixe o Xcode gerenciar (*Automatically manage signing*) com seu time Apple Developer, ou crie manualmente Distribution Certificate + Provisioning Profile.
3. **Arquivar:** Xcode → *Product → Archive* → *Distribute App → App Store Connect → Upload*.
4. **Ficha:** `docs/store/LISTINGS.md`. Screenshots obrigatórios para 6.7" e 5.5" (iPhone) — gere no simulador.
5. **App Privacy ("Nutrition Label"):** preencha com `docs/store/DATA_SAFETY_PRIVACY.md`.
6. **Revisão Apple** (~1–3 dias) é rigorosa com saúde: exigem
   - conta de **teste (login demo)** funcional no campo "App Review Information";
   - clareza de que teleconsulta é com **médicos reais/licenciados** (anexe registro/CRM/responsável técnico);
   - Política de Privacidade acessível **de dentro do app** (link já existe em /privacy).
   ⚠️ **Guideline 3.1.1:** venda de consultas por app iOS pode ter que usar **In-App Purchase** ou se enquadrar como "serviço físico/pessoal" (consulta médica real → normalmente permitido via gateway externo, mas confirme; é o ponto que mais reprova apps de telemedicina).

---

## 9. Checklist final antes de enviar
- [ ] `npm run build` sem erros; `npx cap sync` ok.
- [ ] Ícone/splash gerados e aparecendo.
- [ ] Câmera, microfone e push testados em device físico.
- [ ] Teleconsulta (vídeo) funciona no app (WebRTC + TURN) — testar em 4G, não só Wi-Fi.
- [ ] KYC facial funciona via **HTTPS** (não http://IP — já corrigido no código).
- [ ] Login demo criado para revisão das lojas.
- [ ] Política de Privacidade + Termos acessíveis dentro do app.
- [ ] versionCode/build incrementados.
- [ ] Deep links testados (abrir link aloclinica.com.br cai no app).

## 10. Dica: automatizar com CI (opcional)
`Codemagic` ou `EAS Build` compilam Android **e** iOS na nuvem (sem Mac próprio) e publicam direto nas lojas. Recomendado se você não tem Mac. O `appId` e os assets já estão prontos para isso.
