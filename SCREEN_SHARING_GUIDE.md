# 🖥️ Screen Sharing em Consultas WebRTC

**Data:** 13/04/2026  
**Status:** ✅ Implementado e Compilado  
**Componentes Modificados:** 2 (use-webrtc.ts + VideoConsultation.tsx)

---

## 📋 O Que Foi Criado

### 1️⃣ Extensão do Hook: `useWebRTC`
**Arquivo:** `src/hooks/use-webrtc.ts`

**Novas Funcionalidades:**
- Captura de tela via `navigator.mediaDevices.getDisplayMedia()`
- Sinalização de início/parada de compartilhamento (`screen-share-start` | `screen-share-stop`)
- Adição dinâmica de track de tela ao `RTCPeerConnection`
- Detecção automática de parada (botão do browser)
- Gerenciamento de refs e senders para múltiplos tracks

**Novas Props no Return:**
```tsx
{
  screenStream: MediaStream | null;          // Stream local da tela
  remoteScreenStream: MediaStream | null;    // Stream da tela remota
  isScreenSharing: boolean;                   // Estado de compartilhamento
  toggleScreenShare: () => Promise<void>;     // Ativa/desativa compartilhamento
}
```

---

### 2️⃣ Componente Atualizado: `VideoConsultation`
**Arquivo:** `src/components/consultation/VideoConsultation.tsx`

**Novo Handle Exposto:**
```tsx
interface VideoConsultationHandle {
  toggleScreenShare: () => Promise<void>;
  isScreenSharing: boolean;
  // ... métodos anteriores
}
```

**Novos Elementos UI:**
- 🖥️ Botão de screen share (Monitor icon / Lucide)
- 📺 Video element para exibição da tela compartilhada
- 🔵 Badge indicador "Compartilhando tela" (azul)
- 🎮 Barra de controles flutuante (mute, video, screen, hangup)

**Fluxo Visual:**
```
┌──────────────────────────────────────────┐
│        Remote Video (fullscreen)         │
│  ou Remote Screen (fullscreen) se ativo  │
│                                          │
│   [🔊] [🎥] [🔄] [🖥️] [☎️]  ← Controles │
│                                          │
│  [Local PIP]  📺 Compartilhando tela    │
└──────────────────────────────────────────┘
```

---

## 🔌 Como Funciona

### 1. **Iniciar Compartilhamento**
```tsx
// Clica no botão 🖥️
toggleScreenShare()
  ↓
navigator.mediaDevices.getDisplayMedia()
  ↓
RTCPeerConnection.addTrack(screenTrack)
  ↓
sendSignal({ type: "screen-share-start" })
  ↓
Tela aparece fullscreen
```

### 2. **Receber Compartilhamento Remoto**
```tsx
// Recebe sinal remoto
handleSignal({ type: "screen-share-start" })
  ↓
ontrack event do RTCPeerConnection
  ↓
remoteScreenStream recebe o track
  ↓
Tela remota aparece fullscreen
```

### 3. **Parar Compartilhamento**
```tsx
// Duas opções:
// A) Clica no botão 🖥️ novamente
toggleScreenShare()
  ↓
screenTrack.stop()
  ↓
RTCRtpSender.replaceTrack(null)
  ↓
sendSignal({ type: "screen-share-stop" })

// B) Clica no botão "Stop sharing" da browser API
screenTrack.onended event
  ↓
Mesmo fluxo de parada
```

---

## 🎨 UI/UX Details

### Controles Flutuantes (Bottom Center)
```
[🔊 Mute]  [🎥 Câmera]  [🔄 Trocar]  [🖥️ Tela]  [☎️ Desligar]
```

- **Responsivo:** 44x44px mínimo (touch-friendly)
- **Animações:** Fade in/out com Framer Motion
- **Estados:**
  - Normal: azul claro
  - Ativo: azul escuro/branco
  - Desligado: vermelho

### Badge de Compartilhamento (Top Right)
```
🖥️ Compartilhando tela
```
- Aparece apenas quando `isScreenSharing === true`
- Fundo azul com backdrop blur
- Desaparece automaticamente ao parar

### Video Elements
```tsx
<video ref={screenVideoRef} />      // Local screen
<video ref={remoteScreenVideoRef} /> // Remote screen
```
- Exibidas em **fullscreen** quando ativas
- Z-index 2 (acima de remote video)
- `object-contain` para manter aspecto
- Fundo preto para preencher espaços

---

## ⚙️ Detalhes Técnicos

### WebRTC Peer Connection
```typescript
// Adição de track
const screenTrack = displayStream.getVideoTracks()[0];
const sender = pc.addTrack(screenTrack, displayStream);

// Substituição dinâmica
await sender.replaceTrack(screenTrack);

// Remoção
await sender.replaceTrack(null);
```

### Constraints de Captura
```typescript
{
  video: {
    cursor: "always",        // Mostrar cursor
    displaySurface: "monitor" // Tela completa
  },
  audio: false // Sem áudio da tela
}
```

### Sinalização
**Signal Payload Types:**
```json
{
  "type": "screen-share-start",
  "sender": "user-id",
  "data": null
}

{
  "type": "screen-share-stop",
  "sender": "user-id",
  "data": null
}
```

---

## 🚀 Fluxo Completo

```
┌────────────────────────────────────────┐
│  Consulta em andamento                 │
│  [Médico/Paciente compartilhando tela] │
├────────────────────────────────────────┤
│  Clica no botão 🖥️ Screen Share        │
├────────────────────────────────────────┤
│  Browser pede permissão                │
│  "Qual tela deseja compartilhar?"      │
├────────────────────────────────────────┤
│  Usuário seleciona tela/janela         │
├────────────────────────────────────────┤
│  displayStream capturada                │
│  Track adicionado ao RTCPeerConnection │
│  Sinal enviado ao outro usuário        │
├────────────────────────────────────────┤
│  Outro usuário recebe sinal            │
│  remoteScreenStream é preenchido       │
├────────────────────────────────────────┤
│  Tela compartilhada aparece fullscreen │
│  com Badge azul "Compartilhando tela"  │
├────────────────────────────────────────┤
│  Badge desaparece quando parar         │
│  Volta para vídeo normal               │
└────────────────────────────────────────┘
```

---

## 📱 Compatibilidade

| Recurso | Desktop | iOS Safari | Android Chrome |
|---------|---------|-----------|----------------|
| getDisplayMedia | ✅ (Chrome 72+) | ⚠️ (iOS 15+) | ✅ |
| Captura de tela | ✅ | ⚠️ (limitado) | ✅ |
| Cursor visível | ✅ | ⚠️ | ✅ |
| Multitela | ✅ | ❌ | ❌ |
| Falback gracioso | ✅ | ✅ | ✅ |

**Nota:** Se `getDisplayMedia()` falha (NotAllowedError), é ignorado silenciosamente. O usuário pode tentar novamente.

---

## 🎯 Casos de Uso

1. **Diagnóstico Visual**
   - Médico compartilha resultado de exame
   - Paciente vê laudo em tempo real

2. **Suporte Técnico**
   - Médico compartilha formulário
   - Paciente preenche junto

3. **Educação**
   - Professor compartilha slides/imagens
   - Alunos acompanham em tempo real

4. **Gravação**
   - Tela compartilhada inclusa na gravação (próximo passo)

---

## 💾 Como Usar Programaticamente

```tsx
import { VideoConsultation, type VideoConsultationHandle } from "@/components/consultation/VideoConsultation";

function ConsultationPage() {
  const videoRef = useRef<VideoConsultationHandle>(null);

  const handleStartScreenShare = async () => {
    if (videoRef.current) {
      await videoRef.current.toggleScreenShare();
      console.log(`Screen sharing: ${videoRef.current.isScreenSharing}`);
    }
  };

  return (
    <>
      <VideoConsultation
        ref={videoRef}
        appointmentId="apt-123"
        userName="Dr. João"
        onEndCall={() => console.log("Chamada encerrada")}
      />
      
      <button onClick={handleStartScreenShare}>
        Compartilhar Tela (programático)
      </button>
    </>
  );
}
```

---

## 🐛 Tratamento de Erros

```typescript
try {
  const displayStream = await navigator.mediaDevices.getDisplayMedia({...});
} catch (err) {
  if (err.name === "NotAllowedError") {
    // Usuário clicou em "Cancelar"
    console.info("User cancelled screen share");
  } else if (err.name === "NotSupportedError") {
    // Browser não suporta
    console.error("getDisplayMedia not supported");
    // Mostrar fallback ou mensagem de erro
  } else {
    console.error("Screen share error:", err);
  }
}
```

---

## 🔄 Próximos Passos

1. **Gravação de Consultas** — Incluir screen stream na gravação
2. **Annotation Tools** — Desenhar/apontar na tela compartilhada
3. **Screen Recording** — Salvar vídeo da tela
4. **Multi-Share** — Compartilhar múltiplas telas simultaneamente
5. **Performance** — Bitrate adaptativo para tela

---

## ✅ Checklist de Implementação

- [x] Estender `use-webrtc.ts` com screen sharing
- [x] Atualizar `VideoConsultation.tsx`
- [x] Adicionar UI controls (botão + badge)
- [x] Implementar sinalização (screen-share-start/stop)
- [x] Tratar onended event
- [x] Build compilado sem erros
- [x] Documentação criada
- [ ] Testes E2E
- [ ] Deploy em produção
- [ ] Gravação integrada
- [ ] Annotation tools

---

**Status Final:** ✅ **Screen Sharing Funcional**  
**Próxima Feature:** Gravação de Consultas (Recording) 🎥

