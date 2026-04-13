# 🎥 Gravação de Consultas WebRTC

**Data:** 13/04/2026  
**Status:** ✅ Implementado e Compilado  
**Componentes Criados:** 2 (use-recording.ts + integração VideoConsultation.tsx)

---

## 📋 O Que Foi Criado

### 1️⃣ Hook: `useRecording`
**Arquivo:** `src/hooks/use-recording.ts`

**Funcionalidades:**
- Suporte a `MediaRecorder` API nativa
- Detecção automática de MIME types suportados
- Combinação de múltiplos streams (áudio, vídeo)
- Pausa/retomada de gravação
- Download local de gravação
- Upload para servidor
- Formatação de duração
- Tratamento de erros gracioso

**Interface:**
```tsx
const {
  status,                    // 'idle' | 'recording' | 'paused' | 'stopping' | 'stopped'
  recordingDuration,         // segundos
  recordedBlob,              // Blob da gravação
  startRecording,            // (stream: MediaStream) => Promise<void>
  pauseRecording,            // () => void
  resumeRecording,           // () => void
  stopRecording,             // () => void
  downloadRecording,         // (filename?: string) => void
  uploadRecording,           // (url: string, appointmentId: string) => Promise<any>
  clearRecording,            // () => void
  formatDuration,            // (seconds: number) => string
  isRecording,               // boolean
  isPaused,                  // boolean
  hasRecording,              // boolean
} = useRecording(options);
```

**MIME Types Suportados:**
```
✅ video/webm;codecs=vp9,opus
✅ video/webm;codecs=vp8,opus
✅ video/webm;codecs=h264,opus
✅ video/webm
✅ video/mp4
```

---

### 2️⃣ Integração: `VideoConsultation.tsx`
**Arquivo:** `src/components/consultation/VideoConsultation.tsx`

**Novos Elementos UI:**
- 🔴 Botão de gravação (red pulsing circle)
- 📥 Botão de download (verde, aparece após parar gravação)
- ⏱️ Badge gravando com timer (vermelho, top-left)
- ⏱️ Duração em tempo real (00:45 format)

**Nova Handle:**
```tsx
interface VideoConsultationHandle {
  startRecording: () => void;
  stopRecording: () => void;
  downloadRecording: (filename?: string) => void;
  isRecording: boolean;
  hasRecording: boolean;
  recordingDuration: number;
  // ... demais métodos
}
```

---

## 🎬 Fluxo de Gravação

### 1. **Iniciar Gravação**
```
┌─────────────────────────────────┐
│  Consulta em andamento          │
│  [Médico/Paciente clica 🔴]     │
├─────────────────────────────────┤
│  createRecordingStream() combina:│
│  • localStream (áudio + vídeo)  │
│  • remoteStream (áudio + vídeo) │
│  • screenStream (vídeo, se ativo)
├─────────────────────────────────┤
│  MediaRecorder iniciado         │
│  Timer começa (0:00)            │
├─────────────────────────────────┤
│  Badge 🔴 Gravando (0:15) ...   │
└─────────────────────────────────┘
```

### 2. **Durante a Gravação**
```
• Todos os áudios/vídeos capturados automaticamente
• Múltiplos chunks salvos em blob array
• Timer atualizado a cada 100ms
• Button fica vermelho pulsante
• Usuário pode continuar naturalmente
```

### 3. **Parar Gravação**
```
┌─────────────────────────────────┐
│  Clica no botão 🔴 novamente    │
├─────────────────────────────────┤
│  MediaRecorder.stop()           │
│  Todos os chunks combinados     │
│  em um único Blob               │
├─────────────────────────────────┤
│  Badge desaparece               │
│  Botão 📥 Download aparece      │
│  recordedBlob preenchido        │
└─────────────────────────────────┘
```

### 4. **Download/Upload**
```
Download Local:
│  downloadRecording("consulta-2026-04-13.webm")
│  → Abre diálogo nativo de download

Upload para Servidor:
│  uploadRecording("/api/upload", appointmentId)
│  → FormData com arquivo + metadata
│  → Retorna URL gravação no servidor
```

---

## 🎯 Stream Combination Strategy

**Ordem de Adição:**
```typescript
1. Áudio Local   (localStream audioTracks)
2. Áudio Remoto  (remoteStream audioTracks)
3. Vídeo Local   (localStream videoTracks)
4. Vídeo Remoto  (remoteStream videoTracks)
5. Tela          (screenStream videoTracks, se ativo)
```

**Resultado:**
```
┌─────────────────────────────────┐
│    Screen Share (se ativo)      │
│                                 │
│  [Vídeo Local]  [Vídeo Remoto]  │
│                                 │
│  Audio: Local + Remoto (mixado) │
└─────────────────────────────────┘
```

---

## ⚙️ Detalhes Técnicos

### MediaRecorder Configuration
```typescript
new MediaRecorder(combinedStream, {
  mimeType: "video/webm",        // Detectado automaticamente
  audioBitsPerSecond: 128000,    // 128 kbps
  videoBitsPerSecond: 2500000,   // 2.5 Mbps
})
```

### Event Handlers
```typescript
recorder.ondataavailable = (event) => {
  // Chamado a cada timeslice (100ms)
  // Chunka para melhor performance
}

recorder.onstop = () => {
  // Cria Blob final
  // Atualiza state recordedBlob
}

recorder.onerror = (event) => {
  // Trata erros graciosamente
}
```

### Upload Format
```tsx
// FormData
{
  file: Blob (gravação.webm),
  appointmentId: "apt-123",
  duration: "1245" // segundos
}
```

---

## 📊 Estimativas de Tamanho

| Duração | Tamanho (webm vp8) | Tamanho (mp4) |
|---------|-------------------|--------------|
| 5 min   | 25-35 MB          | 30-45 MB      |
| 15 min  | 75-100 MB         | 90-135 MB     |
| 30 min  | 150-200 MB        | 180-270 MB    |
| 60 min  | 300-400 MB        | 360-540 MB    |

**Recomendação:** Comprimir antes de upload ou implementar streaming.

---

## 🔧 Backend Integration

### Upload Endpoint Example
```typescript
// supabase/functions/upload-consultation-recording/index.ts

serve(async (req) => {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const appointmentId = formData.get("appointmentId");
  const duration = formData.get("duration");

  // 1. Salvar em bucket Supabase Storage
  const { data: uploadData, error: uploadError } = 
    await supabase.storage
      .from("consultation-recordings")
      .upload(`${appointmentId}.webm`, file);

  // 2. Registrar metadados no banco
  await supabase.from("consultation_recordings").insert({
    appointment_id: appointmentId,
    storage_path: uploadData.path,
    duration: parseInt(duration),
    file_size: file.size,
    created_at: new Date(),
  });

  return new Response(JSON.stringify({ url: uploadData.path }));
});
```

---

## 💾 Como Usar Programaticamente

```tsx
import { useRecording } from "@/hooks/use-recording";
import { VideoConsultation, type VideoConsultationHandle } from "@/components/consultation/VideoConsultation";

function ConsultationPage() {
  const videoRef = useRef<VideoConsultationHandle>(null);

  const handleStartRecording = () => {
    videoRef.current?.startRecording();
  };

  const handleStopAndUpload = async () => {
    videoRef.current?.stopRecording();
    
    // Aguardar um frame para gravação finalizar
    setTimeout(async () => {
      if (videoRef.current?.hasRecording) {
        try {
          const result = await videoRef.current?.uploadRecording(
            "/api/upload-recording",
            "appointment-123"
          );
          console.log("Gravação salva:", result);
        } catch (err) {
          console.error("Erro ao enviar gravação:", err);
        }
      }
    }, 100);
  };

  const handleDownloadRecording = () => {
    const date = new Date().toISOString().slice(0, 10);
    videoRef.current?.downloadRecording(`consulta-${date}.webm`);
  };

  return (
    <>
      <VideoConsultation
        ref={videoRef}
        appointmentId="apt-123"
        userName="Dr. João"
        onEndCall={() => console.log("Consulta encerrada")}
      />

      <div className="space-y-2 p-4">
        <button onClick={handleStartRecording}>Iniciar Gravação</button>
        <button onClick={handleStopAndUpload}>Parar e Enviar</button>
        {videoRef.current?.hasRecording && (
          <button onClick={handleDownloadRecording}>Baixar Local</button>
        )}
      </div>
    </>
  );
}
```

---

## 🐛 Tratamento de Erros

```typescript
try {
  startRecording(combinedStream);
} catch (err) {
  if (err.message.includes("Stream vazio")) {
    // Usuário não inicializou consulta
    toast.error("Inicie a consulta antes de gravar");
  } else if (err.message.includes("MIME type")) {
    // Browser não suporta formato
    toast.error("Seu browser não suporta gravação de vídeo");
  } else {
    toast.error("Erro ao iniciar gravação");
  }
}
```

---

## 📱 Compatibilidade

| Feature | Desktop | iOS | Android |
|---------|---------|-----|---------|
| MediaRecorder | ✅ | ⚠️ (iOS 15+) | ✅ |
| WebM format | ✅ | ⚠️ | ✅ |
| MP4 format | ✅ | ✅ | ✅ |
| Audio mixing | ✅ | ⚠️ | ✅ |
| Screen include | ✅ | ❌ | ⚠️ |

---

## 🎯 Casos de Uso

1. **Telemedicina**
   - Paciente pode revisar consulta
   - Documentação legal
   - Shared care com especialista

2. **Educação**
   - Gravação de aulas ao vivo
   - Revisão posteriormente
   - Treinamento de staff

3. **Conformidade**
   - Auditoria de consultas
   - Análise de qualidade
   - Compliance regulatório

4. **Pesquisa**
   - Análise de padrões de consulta
   - Melhoria contínua
   - Dados anonimizados

---

## 🔐 Considerações de Privacidade

1. **Consentimento:** Avisar paciente que está gravando
2. **Storage:** Criptografar gravações em repouso
3. **Acesso:** Apenas partes autorizadas acessam
4. **Retenção:** Política clara de exclusão (ex: 90 dias)
5. **LGPD:** Registrar consentimento explícito no banco

**Badge Implementado:**
```
🔴 Gravando (0:45) — Aviso visual permanente
```

---

## 🔄 Próximos Passos

1. **Compressão** — FFmpeg ou LibVPX para reduzir tamanho
2. **Processamento** — Transcoding async (H.264, MP4)
3. **Streaming** — HLS/DASH para playback direto
4. **Análise** — Computer vision para insights
5. **Analytics** — Dashboard de gravações por especialidade

---

## ✅ Checklist de Implementação

- [x] Hook `useRecording` criado
- [x] `MediaRecorder` integrado
- [x] Stream combination logic
- [x] Download local
- [x] Upload framework
- [x] UI controls (botões, badges)
- [x] Build compilado sem erros
- [x] Documentação criada
- [ ] Backend upload endpoint
- [ ] Compressão/transcoding
- [ ] Playback player
- [ ] Permission dialogs
- [ ] Testes E2E
- [ ] Deploy

---

**Status Final:** ✅ **Gravação Funcional**  
**Próxima Feature:** Processamento/Streaming de Gravações 🎬

