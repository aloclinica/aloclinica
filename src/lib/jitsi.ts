/**
 * Jitsi Meet integration utilities for AloClínica teleconsultation.
 */

 export const JITSI_BASE_URL = "https://meet.jit.si";

export function gerarRoomId(appointmentId: string): string {
  return `consulta-${appointmentId}`;
}

export function getJitsiUrl(roomId: string, displayName: string): string {
  const encodedName = encodeURIComponent(displayName);
  const configParams = [
    "config.startWithAudioMuted=false",
    "config.startWithVideoMuted=false",
    "config.prejoinPageEnabled=false",
    "config.disableDeepLinking=true",
    "config.enableWelcomePage=false",
    "config.enableClosePage=false",
    "interfaceConfig.SHOW_JITSI_WATERMARK=false",
    "interfaceConfig.SHOW_BRAND_WATERMARK=false",
    'interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","hangup","chat","tileview","fullscreen"]',
  ].join("&");

  return `${JITSI_BASE_URL}/${roomId}?userInfo.displayName=${encodedName}#${configParams}`;
}
