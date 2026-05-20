import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UserCheck, AlertCircle } from "lucide-react";
import { logError } from "@/lib/logger";
import { validarCPFDetalhado } from "@/lib/form-validators";

interface QuickPatientCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface FormState {
  first_name: string;
  last_name: string;
  cpf: string;
  phone: string;
  date_of_birth: string;
}

interface FieldErrors {
  first_name?: string;
  last_name?: string;
  cpf?: string;
  phone?: string;
  date_of_birth?: string;
}

const empty: FormState = { first_name: "", last_name: "", cpf: "", phone: "", date_of_birth: "" };

const maskCPF = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
};

const QuickPatientCheckoutDialog = ({ open, onOpenChange, onComplete }: QuickPatientCheckoutDialogProps) => {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    db.from("profiles")
      .select("first_name, last_name, cpf, phone, date_of_birth")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setForm({
          first_name: data?.first_name ?? "",
          last_name: data?.last_name ?? "",
          cpf: data?.cpf ? maskCPF(data.cpf) : "",
          phone: data?.phone ? maskPhone(data.phone) : "",
          date_of_birth: data?.date_of_birth ?? "",
        });
        setErrors({});
        setLoading(false);
      });
  }, [open, user]);

  const validate = (): boolean => {
    const e: FieldErrors = {};

    if (!form.first_name.trim()) {
      e.first_name = "Informe seu nome";
    } else if (form.first_name.trim().length < 2) {
      e.first_name = "Nome muito curto";
    }

    if (!form.last_name.trim()) {
      e.last_name = "Informe seu sobrenome";
    } else if (form.last_name.trim().length < 2) {
      e.last_name = "Sobrenome muito curto";
    }

    const cpfCheck = validarCPFDetalhado(form.cpf);
    if (!cpfCheck.valido) {
      e.cpf = cpfCheck.mensagem;
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      e.phone = "Informe seu telefone";
    } else if (phoneDigits.length < 10) {
      e.phone = `Telefone incompleto (${phoneDigits.length}/10 ou 11 dígitos)`;
    } else if (phoneDigits.length > 11) {
      e.phone = "Telefone possui dígitos demais";
    }

    if (!form.date_of_birth) {
      e.date_of_birth = "Informe sua data de nascimento";
    } else {
      const birth = new Date(form.date_of_birth);
      const today = new Date();
      if (isNaN(birth.getTime())) {
        e.date_of_birth = "Data inválida";
      } else {
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        if (age < 16) e.date_of_birth = "É necessário ter 16 anos ou mais";
        if (age > 120) e.date_of_birth = "Data de nascimento inválida";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!validate()) {
      const firstError = Object.values(errors)[0];
      if (firstError) toast.error("Corrija os campos", { description: firstError });
      return;
    }

    setSaving(true);
    try {
      const { error } = await db.from("profiles").update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        cpf: form.cpf.replace(/\D/g, ""),
        phone: form.phone.replace(/\D/g, ""),
        date_of_birth: form.date_of_birth,
      }).eq("user_id", user.id);

      if (error) throw error;
      toast.success("Dados salvos!");
      onOpenChange(false);
      onComplete();
    } catch (err) {
      logError("QuickPatientCheckout save", err);
      toast.error("Não foi possível salvar", { description: "Tente novamente." });
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof FormState>(field: K, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Cadastro rápido do paciente
          </DialogTitle>
          <DialogDescription>
            Precisamos destes dados para emitir seu recibo e seguir com o agendamento.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qpc-first">Nome</Label>
                <Input
                  id="qpc-first"
                  value={form.first_name}
                  onChange={(e) => updateField("first_name", e.target.value)}
                  className={`h-11 rounded-xl ${errors.first_name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.first_name && (
                  <p className="text-[12px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.first_name}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qpc-last">Sobrenome</Label>
                <Input
                  id="qpc-last"
                  value={form.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                  className={`h-11 rounded-xl ${errors.last_name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.last_name && (
                  <p className="text-[12px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.last_name}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qpc-cpf">CPF</Label>
              <Input
                id="qpc-cpf"
                value={form.cpf}
                inputMode="numeric"
                placeholder="000.000.000-00"
                onChange={(e) => updateField("cpf", maskCPF(e.target.value))}
                className={`h-11 rounded-xl ${errors.cpf ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.cpf && (
                <p className="text-[12px] text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.cpf}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qpc-phone">Telefone (WhatsApp)</Label>
              <Input
                id="qpc-phone"
                value={form.phone}
                inputMode="tel"
                placeholder="(11) 91234-5678"
                onChange={(e) => updateField("phone", maskPhone(e.target.value))}
                className={`h-11 rounded-xl ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.phone && (
                <p className="text-[12px] text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qpc-dob">Data de nascimento</Label>
              <Input
                id="qpc-dob"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => updateField("date_of_birth", e.target.value)}
                className={`h-11 rounded-xl ${errors.date_of_birth ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.date_of_birth && (
                <p className="text-[12px] text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.date_of_birth}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || loading}
            className="rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Salvar e continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickPatientCheckoutDialog;

export const isProfileComplete = (p: Partial<{ first_name: string | null; last_name: string | null; cpf: string | null; phone: string | null; date_of_birth: string | null; }> | null | undefined) => {
  if (!p) return false;
  return Boolean(p.first_name && p.last_name && p.cpf && p.phone && p.date_of_birth);
};
