import { useState, useRef, useCallback, useEffect } from "react";
import { logError, warn } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Camera, RotateCcw, CheckCircle2, XCircle, Loader2, FileImage, User, ShieldCheck, Sparkles, Lock, IdCard, CreditCard, BookOpen, ArrowLeft, Sun, Eye, Focus, Move } from "lucide-react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Step = "intro" | "doc_type" | "document" | "document_back" | "selfie" | "analyzing" | "result";

type DocType = "rg" | "cnh" | "passaporte";

const DOC_TYPES: { id: DocType; label: string; desc: string; needsBack: boolean; icon: any }[] = [
  { id: "rg", label: "RG", desc: "Registro Geral (frente e verso)", needsBack: true, icon: IdCard },
  { id: "cnh", label: "CNH", desc: "Carteira de Habilitação (frente e verso)", needsBack: true, icon: CreditCard },
  { id: "passaporte", label: "Passaporte", desc: "Página com foto", needsBack: false, icon: BookOpen },
];

interface KYCResult {
  match: boolean;
  score: number;
  status: string;
  nome?: string | null;
  cpf?: string | null;
}

interface BiometricKYCProps {
  onComplete?: (result: KYCResult) => void;
  variant?: "full" | "compact";
  className?: string;
  tipo?: "medico" | "paciente";
}

/**
 * Calls the didit-kyc edge function which uses DeepSeek Vision API
 * for real biometric face matching and document data extraction.
 */
interface VerifyResponse {
  match: boolean;
  score: number;
  nome: string | null;
  cpf: string | null;
  status: string;
  error?: string | null;
  mismatch_reasons?: string[];
  data_mismatch?: boolean;
}

async function verifyViaDeepSeek(
  documentDataUrl: string,
  selfieDataUrl: string,
  documentBackDataUrl: string | null,
  documentType: DocType,
): Promise<VerifyResponse> {
  const { data: sessionData } = await db.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) throw new Error("Sessão expirada. Faça login novamente.");

  const res = await db.functions.invoke("didit-kyc", {
    body: {
      document_image: documentDataUrl,
      selfie_image: selfieDataUrl,
      document_back: documentBackDataUrl,
      document_type: documentType,
    },
  });

  if (res.error) {
    throw new Error(res.error.message || "Erro na verificação biométrica");
  }

  const data = res.data as any;
  return {
    match: data.match === true,
    score: typeof data.score === "number" ? data.score : 0,
    nome: data.nome ?? null,
    cpf: data.cpf ?? null,
    status: data.status || (data.match ? "approved" : "rejected"),
    error: data.error ?? null,
    mismatch_reasons: Array.isArray(data.mismatch_reasons) ? data.mismatch_reasons : [],
    data_mismatch: data.data_mismatch === true,
  };
}

// =========== Quality detection ===========
type QualityStatus = "good" | "dark" | "bright" | "blurry" | "still" | "init";
interface QualitySample {
  brightness: number; // 0..255
  sharpness: number;  // arbitrary
  motion: number;     // 0..255 avg diff
  status: QualityStatus;
  message: string;
}

function gradeQuality(
  brightness: number,
  sharpness: number,
  motion: number,
  requireMotion: boolean,
): { status: QualityStatus; message: string } {
  if (brightness < 55) return { status: "dark", message: "Procure um local com mais luz" };
  if (brightness > 220) return { status: "bright", message: "Reduza o brilho/contraluz" };
  if (sharpness < 8) return { status: "blurry", message: "Mantenha a câmera firme para focar" };
  if (requireMotion && motion < 4) return { status: "still", message: "Mova levemente a cabeça (prova de vida)" };
  return { status: "good", message: "Boa! Mantenha assim..." };
}

const BiometricKYC = ({ onComplete, variant = "full", className = "", tipo = "paciente" }: BiometricKYCProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("intro");
  const [docType, setDocType] = useState<DocType | null>(null);
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [documentBackImage, setDocumentBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [result, setResult] = useState<KYCResult | null>(null);
  const [rejection, setRejection] = useState<{ reasons: string[]; error?: string | null } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<"document" | "document_back" | "selfie">("document");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [quality, setQuality] = useState<QualitySample>({ brightness: 0, sharpness: 0, motion: 0, status: "init", message: "Iniciando câmera..." });
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  const verificationIdRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qualityRafRef = useRef<number | null>(null);
  const goodSinceRef = useRef<number | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const capturedRef = useRef(false);

  const startCamera = useCallback(async (target: "document" | "document_back" | "selfie") => {
    setCaptureTarget(target);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: target === "selfie" ? "user" : "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      logError("Camera access error in BiometricKYC", err);
      toast.error("Não foi possível acessar a câmera", { description: "Verifique as permissões do navegador." });
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    if (qualityRafRef.current) cancelAnimationFrame(qualityRafRef.current);
    qualityRafRef.current = null;
    goodSinceRef.current = null;
    prevFrameRef.current = null;
    setAutoCountdown(null);
    setQuality({ brightness: 0, sharpness: 0, motion: 0, status: "init", message: "Câmera parada" });
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    if (capturedRef.current) return;
    capturedRef.current = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    handleCapturedImage(dataUrl);
    stopCamera();
    setTimeout(() => { capturedRef.current = false; }, 400);
  }, [captureTarget, stopCamera]);

  const handleCapturedImage = (dataUrl: string) => {
    if (captureTarget === "document") {
      setDocumentImage(dataUrl);
      // Se tipo precisa de verso → vai pra verso, senão → selfie
      const needsBack = docType ? DOC_TYPES.find((d) => d.id === docType)?.needsBack : false;
      setStep(needsBack ? "document_back" : "selfie");
    } else if (captureTarget === "document_back") {
      setDocumentBackImage(dataUrl);
      setStep("selfie");
    } else {
      setSelfieImage(dataUrl);
    }
  };

  // Auto-abre câmera ao entrar nas etapas de captura (sem opção de upload — somente câmera)
  useEffect(() => {
    if (step === "document" && !documentImage && !cameraActive) {
      void startCamera("document");
    } else if (step === "document_back" && !documentBackImage && !cameraActive) {
      void startCamera("document_back");
    } else if (step === "selfie" && !selfieImage && !cameraActive) {
      void startCamera("selfie");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ======= Real-time quality + auto-capture loop =======
  useEffect(() => {
    if (!cameraActive) return;
    const video = videoRef.current;
    if (!video) return;

    const off = document.createElement("canvas");
    const W = 96, H = 72;
    off.width = W; off.height = H;
    const ctx = off.getContext("2d", { willReadFrequently: true })!;
    let lastSample = performance.now();

    const requireMotion = captureTarget === "selfie";

    const loop = (now: number) => {
      qualityRafRef.current = requestAnimationFrame(loop);
      if (now - lastSample < 220) return;
      lastSample = now;
      if (video.readyState < 2 || video.videoWidth === 0) return;

      try {
        ctx.drawImage(video, 0, 0, W, H);
        const data = ctx.getImageData(0, 0, W, H).data;

        // brightness
        let sum = 0;
        const grayBuf = new Float32Array(W * H);
        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
          const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          grayBuf[p] = g;
          sum += g;
        }
        const brightness = sum / (W * H);

        // sharpness (Laplacian variance approx)
        let lapSum = 0, lapSqSum = 0, n = 0;
        for (let y = 1; y < H - 1; y++) {
          for (let x = 1; x < W - 1; x++) {
            const i = y * W + x;
            const lap =
              -grayBuf[i - W] - grayBuf[i - 1] + 4 * grayBuf[i] - grayBuf[i + 1] - grayBuf[i + W];
            lapSum += lap;
            lapSqSum += lap * lap;
            n++;
          }
        }
        const mean = lapSum / n;
        const sharpness = Math.sqrt(Math.max(0, lapSqSum / n - mean * mean));

        // motion (frame diff)
        let motion = 0;
        if (prevFrameRef.current && prevFrameRef.current.length === data.length) {
          let diff = 0;
          for (let i = 0; i < data.length; i += 4) {
            diff += Math.abs(data[i] - prevFrameRef.current[i]);
          }
          motion = diff / (W * H);
        }
        prevFrameRef.current = new Uint8ClampedArray(data);

        const graded = gradeQuality(brightness, sharpness, motion, requireMotion);
        setQuality({ brightness, sharpness, motion, ...graded });

        // auto-capture when sustained 'good'
        if (graded.status === "good") {
          if (goodSinceRef.current == null) goodSinceRef.current = now;
          const held = (now - goodSinceRef.current) / 1000;
          const remaining = Math.max(0, 1.4 - held);
          setAutoCountdown(remaining);
          if (remaining === 0 && !capturedRef.current) {
            capturePhoto();
          }
        } else {
          goodSinceRef.current = null;
          setAutoCountdown(null);
        }
      } catch (e) {
        // ignore single-frame errors
      }
    };
    qualityRafRef.current = requestAnimationFrame(loop);
    return () => {
      if (qualityRafRef.current) cancelAnimationFrame(qualityRafRef.current);
      qualityRafRef.current = null;
    };
  }, [cameraActive, captureTarget, capturePhoto]);

  const analyzeImages = async () => {
    if (!documentImage || !selfieImage || !user || !docType) return;
    setStep("analyzing");
    setRejection(null);

    // Registra "em andamento" no histórico antes de chamar a IA
    try {
      const { data: inProg } = await db
        .from("kyc_verificacoes" as any)
        .insert({
          user_id: user.id,
          status: "in_progress",
          tipo,
          document_type: docType,
        })
        .select("id")
        .single();
      verificationIdRef.current = (inProg as any)?.id ?? null;
    } catch (e) {
      warn("[BiometricKYC] não foi possível registrar in_progress", e);
    }

    try {
      const verification = await verifyViaDeepSeek(documentImage, selfieImage, documentBackImage, docType);

      // Threshold elevado para 80 — similaridade <80% tem alto risco de falso positivo
      // (CompreFace usa 90% no didit-kyc; mantemos 80 aqui por usar DeepSeek Vision)
      const isApproved = verification.match && verification.score >= 80;
      const status = isApproved ? "aprovado" : "reprovado";
      const score = verification.score;

      // Atualiza (ou insere) o registro final no histórico
      const finalPayload = {
        status: isApproved ? "approved" : "rejected",
        similarity: score / 100,
        tipo,
        document_type: docType,
        mismatch_reasons: verification.mismatch_reasons?.length ? verification.mismatch_reasons : null,
        error_message: verification.error ?? null,
      };
      if (verificationIdRef.current) {
        await db
          .from("kyc_verificacoes" as any)
          .update(finalPayload)
          .eq("id", verificationIdRef.current);
      } else {
        await db.from("kyc_verificacoes" as any).insert({ user_id: user.id, ...finalPayload });
      }

      // Update doctor_profiles kyc_status if doctor
      if (tipo === "medico" && isApproved) {
        await db
          .from("doctor_profiles")
          .update({
            kyc_status: "approved",
            kyc_verified_at: new Date().toISOString(),
            kyc_face_match_score: score,
          } as any)
          .eq("user_id", user.id);
      }

      const kycResult: KYCResult = {
        match: isApproved,
        score,
        status,
        nome: verification.nome,
        cpf: verification.cpf,
      };
      setResult(kycResult);
      if (!isApproved) {
        setRejection({
          reasons: verification.mismatch_reasons || [],
          error: verification.error || null,
        });
      }
      setStep("result");
      onComplete?.(kycResult);

      // Notificar usuário por email — non-blocking (não trava UI se Brevo falhar)
      const userEmail = user.email;
      if (userEmail) {
        const userName = verification.nome || (user.user_metadata as any)?.first_name || "";
        db.functions.invoke("send-email", {
          body: {
            type: isApproved ? "kyc_approved" : "kyc_rejected",
            to: userEmail,
            data: { name: userName, score, similarity: score },
          },
        }).catch((e) => warn("[BiometricKYC] envio de email KYC falhou", e));
      }

      if (isApproved) {
        toast.success("Identidade verificada!", { description: `Similaridade: ${score}%` });
      } else {
        toast.error("Verificação não aprovada", { description: `Similaridade: ${score}% (mínimo 80%)` });
      }
    } catch (err: any) {
      logError("[BiometricKYC] Verification error", err);
      toast.error("Erro na verificação", { description: err.message || "Tente novamente." });
      // Marca o registro em andamento como falha (erro técnico)
      if (verificationIdRef.current) {
        try {
          await db
            .from("kyc_verificacoes" as any)
            .update({
              status: "rejected",
              error_message: err?.message || "Erro técnico durante a verificação",
            })
            .eq("id", verificationIdRef.current);
        } catch {}
      }
      setStep("selfie");
    }
  };

  const reset = () => {
    setStep("intro");
    setDocType(null);
    setDocumentImage(null);
    setDocumentBackImage(null);
    setSelfieImage(null);
    setResult(null);
    setRejection(null);
    setLgpdConsent(false);
    stopCamera();
  };

  if (variant === "compact") {
    return (
      <Button onClick={() => setStep("document")} className={`rounded-xl gap-2 ${className}`} size="sm">
        <ShieldCheck className="w-4 h-4" />
        Verificar Identidade
      </Button>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <canvas ref={canvasRef} className="hidden" />

      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-6 text-center">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl" aria-hidden />
              <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-secondary/10 blur-3xl" aria-hidden />
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-foreground tracking-tight">Verificação biométrica</h3>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Confirme sua identidade em menos de 1 minuto com nossa IA. Rápido, seguro e em conformidade com a LGPD.
                </p>
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-background/60 backdrop-blur border border-border/50">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-semibold text-foreground">Análise por IA em tempo real</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2.5">
              {[
                { icon: FileImage, title: "1. Documento com foto", desc: "RG, CNH ou passaporte — frente legível" },
                { icon: User, title: "2. Selfie ao vivo", desc: "Olhe para a câmera com boa iluminação" },
                { icon: CheckCircle2, title: "3. Pronto!", desc: "Nome e CPF extraídos automaticamente" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/50 p-3.5 bg-card hover:border-primary/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <s.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border/50 p-4 bg-card">
              <Checkbox
                id="lgpd-consent"
                checked={lgpdConsent}
                onCheckedChange={(v) => setLgpdConsent(v === true)}
                className="mt-0.5 shrink-0"
              />
              <label htmlFor="lgpd-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                <span className="font-semibold text-foreground block mb-0.5">Autorizo o tratamento dos meus dados biométricos</span>
                Declaro que li e concordo com a coleta, processamento e armazenamento seguro dos meus dados pessoais e biométricos para fins de verificação de identidade, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). Entendo que meus dados serão criptografados, não serão compartilhados com terceiros e poderei solicitar sua exclusão a qualquer momento.
              </label>
            </div>

            <Button
              onClick={() => setStep("doc_type")}
              disabled={!lgpdConsent}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 gap-2 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5" /> Iniciar verificação
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Criptografia ponta-a-ponta · LGPD · Dados nunca compartilhados</span>
            </div>
          </motion.div>
        )}

        {step === "doc_type" && (
          <motion.div key="doc_type" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">📑 Escolha o tipo de documento</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Selecione qual documento com foto você vai enviar.
              </p>
            </div>
            <Progress value={15} className="h-1.5" />
            <div className="grid gap-2.5">
              {DOC_TYPES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { setDocType(d.id); setStep("document"); }}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 p-4 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center shrink-0 transition-colors">
                    <d.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">{d.label}</p>
                    <p className="text-xs text-muted-foreground">{d.desc}</p>
                  </div>
                  <Camera className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setStep("intro")} className="w-full rounded-xl text-xs text-muted-foreground gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </Button>
          </motion.div>
        )}

        {(step === "document" || step === "document_back" || step === "selfie") && (
          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">
                {step === "document"
                  ? `📄 Frente do ${docType ? DOC_TYPES.find((d) => d.id === docType)?.label : "documento"}`
                  : step === "document_back"
                    ? `🔄 Verso do ${docType ? DOC_TYPES.find((d) => d.id === docType)?.label : "documento"}`
                    : "🤳 Tire uma Selfie"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {step === "document"
                  ? "Posicione a frente do documento, com a foto bem visível"
                  : step === "document_back"
                    ? "Agora capture o verso do documento — todos os dados devem estar legíveis"
                    : "Olhe para a câmera — posicione seu rosto centralizado"}
              </p>
            </div>

            <Progress value={step === "document" ? 35 : step === "document_back" ? 60 : 80} className="h-1.5" />

            {cameraActive ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {/* Overlay de enquadramento */}
                  <div className="absolute inset-0 pointer-events-none">
                    {step === "selfie" ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className={`w-44 h-56 rounded-[50%] border-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] transition-colors ${
                            quality.status === "good"
                              ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5),0_0_0_9999px_rgba(0,0,0,0.55)]"
                              : "border-primary/80"
                          }`}
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center px-6">
                        <div
                          className={`w-full max-w-md aspect-[1.586/1] rounded-xl border-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] relative transition-colors ${
                            quality.status === "good"
                              ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5),0_0_0_9999px_rgba(0,0,0,0.55)]"
                              : "border-primary/80"
                          }`}
                        >
                          {/* cantos */}
                          <span className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl-md" />
                          <span className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr-md" />
                          <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl-md" />
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-white rounded-br-md" />
                        </div>
                      </div>
                    )}
                    {/* Status pill (quality) */}
                    <div className="absolute top-2 left-0 right-0 flex justify-center">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md border ${
                          quality.status === "good"
                            ? "bg-emerald-500/80 text-white border-emerald-300/40"
                            : quality.status === "dark" || quality.status === "bright"
                              ? "bg-amber-500/80 text-white border-amber-300/40"
                              : quality.status === "blurry"
                                ? "bg-orange-500/80 text-white border-orange-300/40"
                                : quality.status === "still"
                                  ? "bg-blue-500/80 text-white border-blue-300/40"
                                  : "bg-black/60 text-white border-white/10"
                        }`}
                      >
                        {quality.status === "good" && <CheckCircle2 className="w-3 h-3" />}
                        {(quality.status === "dark" || quality.status === "bright") && <Sun className="w-3 h-3" />}
                        {quality.status === "blurry" && <Focus className="w-3 h-3" />}
                        {quality.status === "still" && <Move className="w-3 h-3" />}
                        {quality.status === "init" && <Loader2 className="w-3 h-3 animate-spin" />}
                        {quality.message}
                      </div>
                    </div>
                    {/* Auto-capture countdown */}
                    {autoCountdown !== null && autoCountdown > 0 && quality.status === "good" && (
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                        <div className="px-3 py-1.5 rounded-full bg-emerald-500/90 text-white text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md">
                          <Camera className="w-3 h-3" />
                          Capturando em {autoCountdown.toFixed(1)}s
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { stopCamera(); setStep("intro"); }} className="flex-1 rounded-xl">
                    Cancelar
                  </Button>
                  <Button
                    onClick={capturePhoto}
                    disabled={quality.status !== "good" && quality.status !== "init"}
                    className="flex-1 rounded-xl gap-2 bg-primary text-primary-foreground font-bold disabled:opacity-60"
                  >
                    <Camera className="w-4 h-4" />
                    {quality.status === "good" ? "Capturar agora" : "Aguarde..."}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  {step === "selfie"
                    ? "Centralize seu rosto no oval e mova levemente a cabeça (prova de vida). Captura automática quando estiver tudo certo."
                    : "Enquadre o documento dentro da moldura. Captura automática ao detectar boa nitidez e iluminação."}
                </p>
                </div>
            ) : (
              <div className="space-y-3">
                {step === "document" && !documentImage && (
                  <Button onClick={() => startCamera("document")} className="w-full h-12 rounded-xl gap-2 bg-primary text-primary-foreground font-bold">
                    <Camera className="w-5 h-5" /> Abrir câmera
                  </Button>
                )}
                {step === "document" && documentImage && (
                  <div className="rounded-2xl overflow-hidden border border-border/50">
                    <img src={documentImage} alt="Documento" className="w-full" />
                  </div>
                )}
                {step === "document_back" && !documentBackImage && (
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => startCamera("document_back")} className="w-full h-12 rounded-xl gap-2 bg-primary text-primary-foreground font-bold">
                      <Camera className="w-5 h-5" /> Abrir câmera
                    </Button>
                    <Button variant="ghost" onClick={() => { setDocumentImage(null); setStep("document"); }} className="w-full rounded-xl text-xs text-muted-foreground gap-1">
                      <ArrowLeft className="w-3.5 h-3.5" /> Refazer frente
                    </Button>
                  </div>
                )}
                {step === "document_back" && documentBackImage && (
                  <div className="rounded-2xl overflow-hidden border border-border/50">
                    <img src={documentBackImage} alt="Verso do documento" className="w-full" />
                  </div>
                )}
                {step === "selfie" && !selfieImage && (
                  <Button onClick={() => startCamera("selfie")} className="w-full h-12 rounded-xl gap-2 bg-primary text-primary-foreground font-bold">
                    <Camera className="w-5 h-5" /> Abrir câmera frontal
                  </Button>
                )}
                {step === "selfie" && selfieImage && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl overflow-hidden border border-border/50">
                        <img src={documentImage!} alt="Documento" className="w-full aspect-video object-cover" />
                        <p className="text-[10px] text-center text-muted-foreground py-1">Frente</p>
                      </div>
                      {documentBackImage ? (
                        <div className="rounded-xl overflow-hidden border border-border/50">
                          <img src={documentBackImage} alt="Verso" className="w-full aspect-video object-cover" />
                          <p className="text-[10px] text-center text-muted-foreground py-1">Verso</p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/50 flex items-center justify-center aspect-video text-[10px] text-muted-foreground">
                          Sem verso
                        </div>
                      )}
                      <div className="rounded-xl overflow-hidden border border-border/50">
                        <img src={selfieImage} alt="Selfie" className="w-full aspect-video object-cover" />
                        <p className="text-[10px] text-center text-muted-foreground py-1">Selfie</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={reset} className="flex-1 rounded-xl gap-1">
                        <RotateCcw className="w-3.5 h-3.5" /> Refazer
                      </Button>
                      <Button onClick={analyzeImages} className="flex-1 rounded-xl gap-1 bg-primary text-primary-foreground font-bold">
                        <ShieldCheck className="w-4 h-4" /> Verificar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        {step === "analyzing" && (
          <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Verificando identidade com IA...</h3>
            <p className="text-xs text-muted-foreground">Analisando documento e comparando rosto</p>
            <Progress value={50} className="h-1.5 max-w-xs mx-auto animate-pulse" />
          </motion.div>
        )}

        {step === "result" && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${result.status === "aprovado" ? "bg-primary/10" : "bg-destructive/10"}`}>
              {result.status === "aprovado"
                ? <CheckCircle2 className="w-8 h-8 text-primary" />
                : <XCircle className="w-8 h-8 text-destructive" />
              }
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {result.status === "aprovado" ? "Identidade Verificada! ✅" : "Não foi possível verificar"}
            </h3>

            {result.status === "aprovado" && (
              <div className="rounded-2xl border border-border/50 p-4 bg-card text-left space-y-2 max-w-xs mx-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Similaridade</span>
                  <span className="font-bold text-foreground">{result.score}%</span>
                </div>
                {result.nome && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="font-bold text-foreground">{result.nome}</span>
                  </div>
                )}
                {result.cpf && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CPF</span>
                    <span className="font-bold text-foreground">{result.cpf}</span>
                  </div>
                )}
              </div>
            )}

            {result.status !== "aprovado" && (
              <div className="space-y-3 max-w-sm mx-auto">
                {rejection?.reasons && rejection.reasons.length > 0 ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-left space-y-2">
                    <p className="text-xs font-bold text-destructive uppercase tracking-wide">Motivos da rejeição</p>
                    <ul className="space-y-1.5">
                      {rejection.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                          <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {rejection?.error || `Similaridade: ${result.score}% (mínimo 80%)`}
                  </p>
                )}
                <div className="rounded-xl bg-muted/40 p-3 text-left">
                  <p className="text-[11px] font-semibold text-foreground mb-1">Dicas para a próxima tentativa:</p>
                  <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
                    <li>Use um ambiente bem iluminado e sem contraluz</li>
                    <li>Confirme que o nome e CPF do documento batem com os do cadastro</li>
                    <li>Olhe diretamente para a câmera na selfie</li>
                    <li>Aproxime o documento para que todos os dados fiquem legíveis</li>
                  </ul>
                </div>
                <Button onClick={reset} className="rounded-xl gap-2 bg-primary text-primary-foreground font-bold w-full">
                  <RotateCcw className="w-4 h-4" /> Tentar novamente
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BiometricKYC;