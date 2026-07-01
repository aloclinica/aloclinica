import type { CapacitorConfig } from '@capacitor/core';

/**
 * AloClínica — Capacitor wrap (iOS/Android).
 *
 * GERAR OS BINÁRIOS (ver docs/MOBILE_RELEASE_GUIDE.md para o passo a passo completo):
 *   1. npm install
 *   2. npm run build                       (gera dist/)
 *   3. npx cap add android && npx cap add ios
 *   4. npx @capacitor/assets generate      (ícones + splash a partir de resources/)
 *   5. npx cap sync
 *   6. npx cap open android  (Android Studio)  /  npx cap open ios  (Xcode, requer macOS)
 *
 * O bundle ID `br.com.aloclinica.app` precisa ser registrado no
 * Apple Developer Account e no Google Play Console.
 */
const config: CapacitorConfig = {
  appId: 'br.com.aloclinica.app',
  appName: 'AloClínica',
  webDir: 'dist',
  // Servir sob https:// no Android habilita cookies seguros, Service Worker,
  // WebAuthn/biometria e evita bloqueios de conteúdo. NUNCA usar http.
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
    // Permite reprodução inline de vídeo (teleconsulta WebRTC) sem fullscreen forçado.
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    // Mantém bloqueio de conteúdo misto (http em página https) — reforça o uso
    // exclusivo de endpoints HTTPS (CompreFace/DocuSeal/vídeo via domínio).
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#1a6fc4',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1a6fc4',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
