import { useState, useRef, useCallback } from "react";
import { logError } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Camera, RotateCcw, CheckCircle2, XCircle, Loader2, FileImage, User, ShieldCheck, Upload } from "lucide-react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Step = "intro" | "document" | "selfie" | "analyzing" | "result";

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
async function verifyViaDeepSeek(
  documentDataUrl: string,
  selfieDataUrl: string
): Promise<{ match: boolean; score: number; nome: string | null; cpf: string | null; status: string }> {
  const { data: sessionData } = await db.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) throw new Error("Sessão expirada. Faça login novamente.");

  const res = await db.functions.invoke("didit-kyc", {
    body: {
      document_image: documentDataUrl,
      selfie_image: selfieDataUrl,
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
  };
}

const BiometricKYC = ({ onComplete, variant = "full", className = "", tipo = "paciente" }: BiometricKYCProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("intro");
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [result, setResult] = useState<KYCResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<"document" | "selfie">("document");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async (target: "document" | "selfie") => {
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
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (captureTarget === "document") {
      setDocumentImage(dataUrl);
      setStep("selfie");
    } else {
      setSelfieImage(dataUrl);
    }
    stopCamera();
  }, [captureTarget, stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (captureTarget === "document") {
        setDocumentImage(dataUrl);
        setStep("selfie");
      } else {
        setSelfieImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const analyzeImages = async () => {
    if (!documentImage || !selfieImage || !user) return;
    setStep("analyzing");

    try {
      // Call DeepSeek Vision API via edge function for real biometric verification
      const verification = await verifyViaDeepSeek(documentImage, selfieImage);

      const isApproved = verification.match && verification.score >= 60;
      const status = isApproved ? "aprovado" : "reprovado";
      const score = verification.score;

      // Save to kyc_verificacoes
      await db.from("kyc_verificacoes" as any).insert({
        user_id: user.id,
        status: isApproved ? "approved" : "rejected",
        similarity: score / 100,
        tipo,
      });

      // Update doctor_profiles kyc_status if doctor
      if (tipo === "medico" && isApproved) {
        await supabase
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
      setStep("result");
      onComplete?.(kycResult);

      if (isApproved) {
        toast.success("Identidade verificada!", { description: `Similaridade: ${score}%` });
      } else {
        toast.error("Verificação não aprovada", { description: `Similaridade: ${score}% (mínimo 60%)` });
      }
    } catch (err: any) {
      logError("[BiometricKYC] Verification error", err);
      toast.error("Erro na verificação", { description: err.message || "Tente novamente." });
      setStep("selfie");
    }
  };

  const reset = () => {
    setStep("intro");
    setDocumentImage(null);
    setSelfieImage(null);
    setResult(null);
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Verificação Biométrica</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Verificação facial inteligente com IA — tire uma foto do seu documento e uma selfie em poucos segundos.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 p-4 bg-card space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <FileImage className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Documento com foto</p>
                  <p className="text-xs text-muted-foreground">RG, CNH ou passaporte</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Selfie ao vivo</p>
                  <p className="text-xs text-muted-foreground">Comparação facial por IA (DeepSeek Vision)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Extração de dados</p>
                  <p className="text-xs text-muted-foreground">Nome e CPF extraídos automaticamente do documento</p>
                </div>
              </div>
            </div>

            <Button onClick={() => { setStep("document"); startCamera("document"); }} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 gap-2">
              <Camera className="w-5 h-5" /> Iniciar Verificação
            </Button>

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              🔒 Verificação segura com IA. Seus dados são protegidos por criptografia e conformidade com LGPD.
            </p>
          </motion.div>
        )}

        {(step === "document" || step === "selfie") && (
          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">
                {step === "document" ? "📄 Foto do Documento" : "🤳 Tire uma Selfie"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {step === "document"
                  ? "Posicione seu documento de identidade na câmera"
                  : "Olhe para a câmera — posicione seu rosto centralizado"}
              </p>
            </div>

            <Progress value={step === "document" ? 33 : 66} className="h-1.5" />

            {cameraActive ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {step === "selfie" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 rounded-full border-2 border-white/40 border-dashed" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { stopCamera(); setStep("intro"); }} className="flex-1 rounded-xl">
                    Cancelar
                  </Button>
                  <Button onClick={capturePhoto} className="flex-1 rounded-xl gap-2 bg-primary text-primary-foreground font-bold">
                    <Camera className="w-4 h-4" /> Capturar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {step === "document" && !documentImage && (
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => startCamera("document")} className="w-full h-12 rounded-xl gap-2 bg-primary text-primary-foreground font-bold">
                      <Camera className="w-5 h-5" /> Usar Câmera
                    </Button>
                    <Button variant="outline" onClick={() => { setCaptureTarget("document"); fileInputRef.current?.click(); }} className="w-full h-12 rounded-xl gap-2">
                      <Upload className="w-5 h-5" /> Enviar Arquivo
                    </Button>
                  </div>
                )}
                {step === "document" && documentImage && (
                  <div className="rounded-2xl overflow-hidden border border-border/50">
                    <img src={documentImage} alt="Documento" className="w-full" />
                  </div>
                )}
                {step === "selfie" && !selfieImage && (
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => startCamera("selfie")} className="w-full h-12 rounded-xl gap-2 bg-primary text-primary-foreground font-bold">
                      <Camera className="w-5 h-5" /> Abrir Câmera para Selfie
                    </Button>
                    <Button variant="outline" onClick={() => { setCaptureTarget("selfie"); fileInputRef.current?.click(); }} className="w-full h-12 rounded-xl gap-2">
                      <Upload className="w-5 h-5" /> Enviar Arquivo
                    </Button>
                  </div>
                )}
                {step === "selfie" && selfieImage && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl overflow-hidden border border-border/50">
                        <img src={documentImage!} alt="Documento" className="w-full aspect-video object-cover" />
                        <p className="text-[10px] text-center text-muted-foreground py-1">Documento</p>
                      </div>
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
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Similaridade: {result.score}% (mínimo 60%)</p>
                <Button onClick={reset} variant="outline" className="rounded-xl gap-2">
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