import type { CapacitorConfig } from '@capacitor/core';

/**
 * AloClínica — Capacitor wrap.
 *
 * Para gerar binário iOS/Android a partir da PWA atual:
 *   1. npm i -D @capacitor/cli @capacitor/core @capacitor/ios @capacitor/android
 *   2. npm run build                  (gera dist/)
 *   3. npx cap add ios && npx cap add android
 *   4. npx cap sync
 *   5. npx cap open ios               (Xcode) / open android (Android Studio)
 *   6. Configurar assinatura e publicar nas lojas.
 *
 * O bundle ID `br.com.aloclinica.app` precisa ser registrado no
 * Apple Developer Account e no Google Play Console.
 */
const config: CapacitorConfig = {
  appId: 'br.com.aloclinica.app',
  appName: 'AloClínica',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
  },
  android: {
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
  },
};

export default config;
