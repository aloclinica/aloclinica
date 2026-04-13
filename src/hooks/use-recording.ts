/**
 * useRecording — Hook para gravação de consultas WebRTC
 *
 * Features:
 * - Combina múltiplos streams (local, remoto, áudio)
 * - Suporta MediaRecorder API
 * - Download e upload de gravações
 * - Pausa/retomada
 */

import { useState, useRef, useCallback } from "react";
import { logError } from "@/lib/logger";

export type RecordingStatus = "idle" | "recording" | "paused" | "stopping" | "stopped";

export interface RecordingOptions {
  mimeType?: string; // 'video/webm;codecs=vp9', 'video/webm', 'video/mp4', etc
  audioBitsPerSecond?: number;
  videoBitsPerSecond?: number;
  timeslice?: number; // ms para ondataavailable event
}

const SUPPORTED_MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=h264,opus",
  "video/webm",
  "video/mp4",
];

function getSupportedMimeType(): string {
  for (const mimeType of SUPPORTED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return ""; // Fallback ao MediaRecorder padrão
}

export function useRecording(options: RecordingOptions = {}) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationStartRef = useRef<number>(0);

  // ─── Iniciar gravação ───────────────────────────────────────────────────────
  const startRecording = useCallback(async (stream: MediaStream) => {
    try {
      if (!stream || stream.getTracks().length === 0) {
        throw new Error("Stream vazio ou inválido");
      }

      chunksRef.current = [];
      setRecordedBlob(null);
      setRecordingDuration(0);

      const mimeType = options.mimeType || getSupportedMimeType();

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: options.audioBitsPerSecond || 128000,
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000,
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "video/webm",
        });
        setRecordedBlob(blob);
        console.info(`[Recording] Gravação concluída: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);

        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      recorder.onerror = (event) => {
        console.error(`[Recording] Erro: ${event.error}`);
        setStatus("stopped");
      };

      recorderRef.current = recorder;
      recorder.start(options.timeslice || 100);

      // Iniciar contador de duração
      durationStartRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - durationStartRef.current) / 1000));
      }, 100);

      setStatus("recording");
      console.info("[Recording] Gravação iniciada");
    } catch (err) {
      logError("startRecording failed", err);
      setStatus("stopped");
    }
  }, [options]);

  // ─── Pausar gravação ────────────────────────────────────────────────────────
  const pauseRecording = useCallback(() => {
    if (recorderRef.current && status === "recording") {
      recorderRef.current.pause();
      setStatus("paused");
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      console.info("[Recording] Gravação pausada");
    }
  }, [status]);

  // ─── Retomar gravação ───────────────────────────────────────────────────────
  const resumeRecording = useCallback(() => {
    if (recorderRef.current && status === "paused") {
      recorderRef.current.resume();
      setStatus("recording");
      durationStartRef.current = Date.now() - recordingDuration * 1000;
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - durationStartRef.current) / 1000));
      }, 100);
      console.info("[Recording] Gravação retomada");
    }
  }, [status, recordingDuration]);

  // ─── Parar gravação ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (recorderRef.current && (status === "recording" || status === "paused")) {
      setStatus("stopping");
      recorderRef.current.stop();
      recorderRef.current = null;

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      console.info("[Recording] Gravação parada");
      setStatus("stopped");
    }
  }, [status]);

  // ─── Download da gravação ────────────────────────────────────────────────────
  const downloadRecording = useCallback((filename = "consulta.webm") => {
    if (!recordedBlob) {
      console.warn("[Recording] Nenhuma gravação para baixar");
      return;
    }

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.info(`[Recording] Gravação baixada: ${filename}`);
  }, [recordedBlob]);

  // ─── Upload da gravação para servidor ────────────────────────────────────────
  const uploadRecording = useCallback(async (uploadUrl: string, appointmentId: string) => {
    if (!recordedBlob) {
      throw new Error("Nenhuma gravação para enviar");
    }

    try {
      const formData = new FormData();
      formData.append("file", recordedBlob, "consulta.webm");
      formData.append("appointmentId", appointmentId);
      formData.append("duration", recordingDuration.toString());

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.info("[Recording] Gravação enviada com sucesso:", data);
      return data;
    } catch (err) {
      logError("uploadRecording failed", err);
      throw err;
    }
  }, [recordedBlob, recordingDuration]);

  // ─── Limpar gravação ────────────────────────────────────────────────────────
  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingDuration(0);
    chunksRef.current = [];
    setStatus("idle");
  }, []);

  // ─── Formatar duração ───────────────────────────────────────────────────────
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }, []);

  return {
    status,
    recordingDuration,
    recordedBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    downloadRecording,
    uploadRecording,
    clearRecording,
    formatDuration,
    isRecording: status === "recording",
    isPaused: status === "paused",
    hasRecording: recordedBlob !== null,
  };
}

export default useRecording;
