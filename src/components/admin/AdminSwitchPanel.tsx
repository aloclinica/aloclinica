import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "@/components/admin/adminNav";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Eye,
  Handshake,
  Headphones,
  Hospital,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";

const panelOptions = [
  { label: "Paciente", role: "patient", icon: UserRound, description: "Agendamentos, planos e histórico médico", tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300", status: "Jornada" },
  { label: "Médico", role: "doctor", icon: Stethoscope, description: "Agenda, prontuários e ganhos", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", status: "Atendimento" },
  { label: "Recepção", role: "receptionist", icon: Hospital, description: "Check-in, agendas e faturamento", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300", status: "Operação" },
  { label: "Suporte", role: "support", icon: Headphones, description: "Logs, usuários e chat de atendimento", tone: "bg-orange-500/10 text-orange-700 dark:text-orange-300", status: "Fila" },
  { label: "Clínica", role: "clinic", icon: Building2, description: "Gestão de médicos vinculados", tone: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300", status: "Rede" },
  { label: "Parceiro", role: "partner", icon: Handshake, description: "Validação de receitas e relatórios", tone: "bg-teal-500/10 text-teal-700 dark:text-teal-300", status: "Convênios" },
  { label: "Oftalmologista", role: "ophthalmologist", icon: Eye, description: "Exames oftalmológicos e receitas", tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300", status: "Especialidade" },
  { label: "Assistente IA", role: "ai-assistant", icon: Bot, description: "Chat inteligente com IA contextual", tone: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300", status: "IA" },
];

const AdminSwitchPanel = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("switch-panel")}>
      <div className="w-full mx-auto max-w-6xl pb-24 md:pb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4 gap-2 rounded-xl">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel Admin
        </Button>

        <section className="mb-5 rounded-2xl border border-border/50 bg-background/78 p-5 shadow-sm backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-destructive">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Centro interno
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">Trocar Painel</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Acesse rapidamente a visão de cada perfil da plataforma para conferir jornada, operação e atendimento.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="rounded-2xl border border-border/50 bg-muted/35 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Perfis</p>
                <p className="mt-1 text-xl font-black text-foreground">{panelOptions.length}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-muted/35 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Status</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-bold text-emerald-600">
                  <Activity className="h-4 w-4" aria-hidden="true" />
                  Ativo
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          {panelOptions.map((opt) => (
            <button
              key={opt.role}
              type="button"
              className="group rounded-2xl border border-border/60 bg-card/88 p-4 text-left shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={() => navigate(opt.role === "ai-assistant" ? "/dashboard/ai-assistant" : `/dashboard?role=${opt.role}`)}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${opt.tone}`}>
                  <opt.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-full border border-border/50 bg-muted/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {opt.status}
                </span>
              </div>
              <h3 className="text-base font-black text-foreground transition-colors group-hover:text-primary">{opt.label}</h3>
              <p className="mt-2 min-h-[40px] text-sm leading-5 text-muted-foreground">{opt.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border/45 pt-3 text-xs font-bold text-primary">
                Abrir painel
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSwitchPanel;
