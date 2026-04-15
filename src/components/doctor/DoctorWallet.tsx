import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "./doctorNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Star, Stethoscope, Phone, Mail, Award, QrCode, Copy, CheckCircle2, GraduationCap, Heart, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";

const DoctorWallet = () => {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-wallet", user?.id],
    queryFn: async () => {
      const dpRes = await db.from("doctor_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (!dpRes.data) return null;
      const dpId = dpRes.data.id;
      const [specsRes, statsRes] = await Promise.all([
        db.from("doctor_specialties").select("specialty_id, specialties(name)").eq("doctor_id", dpId),
        db.from("appointments").select("id", { count: "exact", head: true }).eq("doctor_id", dpId).eq("status", "completed"),
      ]);
      return {
        doctor: dpRes.data,
        specialties: (specsRes.data ?? []).map((s: any) => s.specialties?.name).filter(Boolean),
        totalConsultations: statsRes.count ?? 0,
      };
    },
    enabled: !!user,
  });

  const fullName = `Dr(a). ${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  const crmFull = data?.doctor ? `CRM ${data.doctor.crm}/${data.doctor.crm_state}` : "";
  const initial = (profile?.first_name?.[0] ?? "D").toUpperCase();

  const copyId = () => {
    navigator.clipboard.writeText(data?.doctor?.id ?? "");
    setCopied(true);
    toast.success("ID copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("wallet")}>
      <div className="max-w-lg mx-auto space-y-6 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Carteira Profissional
          </h2>
          <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setFlipped(!flipped)}>
            <Sparkles className="w-3.5 h-3.5" /> {flipped ? "Frente" : "Verso"}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : !data ? (
          <p className="text-muted-foreground text-center py-12">Perfil médico não encontrado.</p>
        ) : (
          <div className="perspective-[1200px]" onClick={() => setFlipped(!flipped)}>
            <motion.div
              className="relative w-full cursor-pointer"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* ═══ FRONT ═══ */}
              <div className="relative w-full" style={{ backfaceVisibility: "hidden" }}>
                <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-primary/20">
                  {/* Ambient glow */}
                  <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary/15 rounded-full blur-3xl" />

                  {/* Header */}
                  <div className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-6 pb-16">
                    {/* Holographic strip */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    <div className="absolute top-3 right-4 flex items-center gap-1.5 opacity-60">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                      <span className="text-white/50 text-[9px] font-mono tracking-widest">ATIVO</span>
                    </div>

                    <div className="flex items-start justify-between relative z-10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-white/60 text-[9px] font-medium tracking-[0.2em] uppercase">Allo Médico</p>
                            <p className="text-white/40 text-[8px] tracking-wider">CARTEIRA DIGITAL</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-white/10 rounded-xl blur-md" />
                        <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/20">
                          <QrCode className="w-12 h-12 text-white/90" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="relative bg-card p-6 -mt-8 rounded-t-3xl space-y-5 z-10">
                    {/* Avatar overlap */}
                    <div className="flex items-end gap-4 -mt-14">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl blur-md opacity-40 scale-105" />
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt={fullName} className="relative w-24 h-24 rounded-2xl object-cover border-4 border-card shadow-xl" loading="lazy" decoding="async" />
                        ) : (
                          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-black border-4 border-card shadow-xl">
                            {initial}
                          </div>
                        )}
                        {data.doctor.crm_verified && (
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-success flex items-center justify-center border-2 border-card shadow-md">
                            <Shield className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <h3 className="text-lg font-black text-foreground leading-tight">{fullName}</h3>
                        <p className="text-sm font-mono text-primary font-semibold">{crmFull}</p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {data.doctor.is_approved && (
                        <Badge className="bg-success/10 text-success border-success/20 gap-1 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Aprovado
                        </Badge>
                      )}
                      {data.specialties.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-[10px] border-primary/20 text-primary/80">{s}</Badge>
                      ))}
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: data.totalConsultations, label: "Consultas", icon: <Heart className="w-3.5 h-3.5 text-primary" /> },
                        { value: data.doctor.rating ? `${data.doctor.rating.toFixed(1)}★` : "—", label: "Avaliação", icon: <Star className="w-3.5 h-3.5 text-warning" /> },
                        { value: data.doctor.experience_years ?? "—", label: "Anos", icon: <GraduationCap className="w-3.5 h-3.5 text-secondary" /> },
                      ].map(s => (
                        <div key={s.label} className="relative overflow-hidden text-center p-3 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 border border-border/50">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            {s.icon}
                            <span className="text-lg font-black text-foreground">{s.value}</span>
                          </div>
                          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Separator with holographic effect */}
                    <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Membro desde</p>
                        <p className="text-xs font-semibold text-foreground">
                          {data.doctor.created_at ? format(new Date(data.doctor.created_at), "MMMM yyyy", { locale: ptBR }) : "—"}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-[10px] gap-1 h-7 px-2 hover:bg-primary/5" onClick={(e) => { e.stopPropagation(); copyId(); }}>
                        {copied ? <CheckCircle2 className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                        {copied ? "Copiado!" : "Copiar ID"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ BACK ═══ */}
              <div
                className="absolute inset-0 w-full"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-muted/30 h-full">
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

                  {/* Magnetic stripe */}
                  <div className="w-full h-12 bg-gradient-to-r from-foreground/80 via-foreground/90 to-foreground/80 mt-6" />

                  <div className="p-6 space-y-5">
                    {/* Signature area */}
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">Assinatura Digital</p>
                      <div className="h-14 rounded-xl bg-muted/50 border border-dashed border-border flex items-center justify-center">
                        <p className="text-sm italic text-muted-foreground/50 font-serif">{fullName}</p>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-2.5">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Contato</p>
                      {profile?.phone && (
                        <div className="flex items-center gap-2.5 text-sm text-foreground">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><Phone className="w-3.5 h-3.5 text-primary" /></div>
                          <span className="font-medium">{profile.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 text-sm text-foreground">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><Mail className="w-3.5 h-3.5 text-primary" /></div>
                        <span className="font-medium text-xs">{user?.email}</span>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                    {/* ID */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">ID Profissional</p>
                        <p className="text-xs font-mono text-foreground font-semibold mt-0.5">{data?.doctor?.id?.slice(0, 16)}...</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-primary" />
                      </div>
                    </div>

                    <p className="text-[8px] text-center text-muted-foreground/60 pt-2">
                      Esta carteira digital é válida enquanto o profissional mantiver registro ativo no CRM.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorWallet;
