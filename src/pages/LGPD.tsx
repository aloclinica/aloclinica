import { Shield, Lock, Eye, FileCheck, UserCheck, Database, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import InstitutionalHero from "@/components/landing/InstitutionalHero";
import { COMPLIANCE } from "@/config/compliance";

const tocItems = [
  { id: "compromisso", label: "1. Compromisso com a LGPD" },
  { id: "dpo", label: "2. Encarregado de Dados (DPO)" },
  { id: "bases-legais", label: "3. Bases Legais" },
  { id: "seguranca", label: "4. Medidas de Segurança" },
  { id: "direitos", label: "5. Seus Direitos" },
  { id: "incidentes", label: "6. Incidentes" },
  { id: "ripd", label: "7. RIPD" },
  { id: "contato", label: "8. Contato" },
];

const LGPD = () => (
  <div className="min-h-screen relative">
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(270,45%,96%)] via-[hsl(280,35%,93%)] to-[hsl(290,30%,89%)] dark:from-[hsl(270,25%,8%)] dark:via-[hsl(280,20%,10%)] dark:to-[hsl(290,18%,12%)]" />
    <SEOHead title="Conformidade LGPD" description="Como a AloClinica cumpre a Lei Geral de Proteção de Dados." canonical={`${COMPLIANCE.site}/lgpd`} />

    <InstitutionalHero title="Conformidade LGPD" subtitle="Lei nº 13.709/2018" icon={Shield} lastUpdate={COMPLIANCE.ultimaAtualizacaoLegal} />

    <div className="container mx-auto px-4 py-12 max-w-6xl grid lg:grid-cols-[240px_1fr] gap-10">
      {/* Sticky Table of Contents */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Sumário
          </p>
          <nav className="space-y-1">
            {tocItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-xs text-muted-foreground hover:text-primary py-1.5 px-2 rounded-md hover:bg-primary/5 transition-colors leading-snug"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <div className="max-w-3xl">
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {[
          { icon: Shield, title: "Segurança", desc: "Criptografia AES-256 em repouso e TLS 1.3 em trânsito" },
          { icon: Lock, title: "Acesso Restrito", desc: "Row Level Security (RLS) em todas as tabelas" },
          { icon: Eye, title: "Transparência", desc: "Você sabe exatamente quais dados coletamos e por quê" },
          { icon: UserCheck, title: "Seus Direitos", desc: "Acesso, correção, exclusão e portabilidade garantidos" },
          { icon: Database, title: "Minimização", desc: "Coletamos apenas dados estritamente necessários" },
          { icon: FileCheck, title: "Consentimento", desc: "TCLE obrigatório antes de cada teleconsulta" },
        ].map((item, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">

        <h2 id="compromisso" className="text-xl font-bold text-foreground scroll-mt-24">1. Compromisso com a LGPD</h2>
        <p>A AloClinica está plenamente comprometida com o cumprimento da Lei Geral de Proteção de Dados Pessoais (LGPD). Implementamos um programa abrangente de governança de dados que abrange todos os aspectos do tratamento de informações pessoais em nossa plataforma.</p>

        <h2 id="dpo" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">2. Encarregado de Dados (DPO)</h2>
        <p>Nomeamos um Encarregado de Proteção de Dados (DPO) conforme Art. 41 da LGPD:</p>
        <div className="p-4 bg-muted rounded-xl">
          <p className="text-sm text-foreground font-medium">Encarregado de Dados – AloClínica</p>
          <p className="text-xs mt-1">E-mail: {COMPLIANCE.emailDpo}</p>
          <p className="text-xs">Controladora: {COMPLIANCE.razaoSocial} — CNPJ {COMPLIANCE.cnpj}</p>
          <p className="text-xs">Sede: {COMPLIANCE.enderecoSede}</p>
          <p className="text-xs mt-2 italic">O DPO é responsável por receber reclamações, comunicar-se com a ANPD e orientar funcionários e contratados sobre práticas de proteção de dados.</p>
        </div>

        <h2 id="bases-legais" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">3. Bases Legais para Tratamento</h2>
        <p>Todo tratamento de dados pessoais na AloClinica está fundamentado em uma das bases legais previstas nos Arts. 7º e 11 da LGPD:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Consentimento (Art. 7º, I):</strong> marketing, cookies analíticos, pesquisas de satisfação;</li>
          <li><strong>Obrigação legal (Art. 7º, II):</strong> armazenamento de prontuários por 20 anos, emissão de receitas;</li>
          <li><strong>Execução de contrato (Art. 7º, V):</strong> prestação do serviço de teleconsulta, processamento de pagamentos;</li>
          <li><strong>Interesse legítimo (Art. 7º, IX):</strong> segurança da plataforma, prevenção a fraudes, logs de presença;</li>
          <li><strong>Tutela da saúde (Art. 11, II, f):</strong> tratamento de dados sensíveis de saúde durante consultas.</li>
        </ul>

        <h2 id="seguranca" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">4. Medidas Técnicas de Segurança</h2>
        <h3 className="text-base font-semibold text-foreground">4.1. Criptografia</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Dados em trânsito: TLS 1.3 (HTTPS obrigatório);</li>
          <li>Dados em repouso: AES-256 nos servidores de banco de dados;</li>
          <li>Videochamadas: criptografia de ponta a ponta via WebRTC/SRTP.</li>
        </ul>
        <h3 className="text-base font-semibold text-foreground mt-4">4.2. Controle de Acesso</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Row Level Security (RLS) em todas as tabelas do banco de dados;</li>
          <li>Separação de papéis: paciente, médico, clínica, admin, suporte, recepção;</li>
          <li>Tokens de sessão com expiração automática;</li>
          <li>Autenticação via e-mail/senha com opção de verificação em duas etapas.</li>
        </ul>
        <h3 className="text-base font-semibold text-foreground mt-4">4.3. Monitoramento e Auditoria</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Logs de atividade registrando ações sensíveis (acesso a prontuários, edição de dados);</li>
          <li>Logs de presença em videoconsulta (horário de entrada/saída de cada participante);</li>
          <li>Monitoramento contínuo de segurança com alertas automáticos.</li>
        </ul>

        <h2 id="direitos" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">5. Seus Direitos (Arts. 17-22 da LGPD)</h2>
        <p>Como titular de dados pessoais, você tem os seguintes direitos:</p>
        <div className="space-y-3">
          {[
            { right: "Confirmação e Acesso", desc: "Confirmar a existência de tratamento e acessar seus dados pessoais." },
            { right: "Correção", desc: "Solicitar a correção de dados incompletos, inexatos ou desatualizados." },
            { right: "Anonimização/Bloqueio/Eliminação", desc: "De dados desnecessários, excessivos ou tratados em desconformidade." },
            { right: "Portabilidade", desc: "Solicitar a transferência de seus dados a outro fornecedor de serviço." },
            { right: "Eliminação", desc: "Solicitar a exclusão de dados pessoais tratados com base no consentimento." },
            { right: "Informação", desc: "Ser informado sobre entidades com as quais compartilhamos seus dados." },
            { right: "Revogação do Consentimento", desc: "Revogar seu consentimento a qualquer momento, de forma gratuita." },
            { right: "Oposição", desc: "Se opor a tratamento realizado com fundamento em interesse legítimo." },
            { right: "Revisão de Decisões Automatizadas", desc: "Solicitar revisão de decisões tomadas unicamente com base em tratamento automatizado." },
          ].map((item, i) => (
            <div key={i} className="p-3 border border-border/50 rounded-lg">
              <p className="text-sm font-medium text-foreground">{item.right}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3">Para exercer qualquer desses direitos, envie um e-mail para <strong>{COMPLIANCE.emailDpo}</strong>. O prazo para resposta é de até 15 dias úteis conforme Art. 18, §5º da LGPD.</p>

        <h2 id="incidentes" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">6. Incidentes de Segurança</h2>
        <p>Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, a AloClinica se compromete a:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Comunicar a ANPD e os titulares afetados em prazo razoável (Art. 48 da LGPD);</li>
          <li>Descrever a natureza dos dados afetados;</li>
          <li>Indicar as medidas técnicas de segurança utilizadas;</li>
          <li>Informar as medidas adotadas para reverter ou mitigar os efeitos do incidente.</li>
        </ul>

        <h2 id="ripd" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">7. Relatório de Impacto (RIPD)</h2>
        <p>A AloClinica elabora e mantém atualizado o Relatório de Impacto à Proteção de Dados Pessoais (RIPD) conforme Art. 38 da LGPD, considerando especialmente o tratamento de dados sensíveis de saúde. O RIPD poderá ser disponibilizado à ANPD quando solicitado.</p>

        <h2 id="contato" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">8. Contato e Reclamações</h2>
        <p>Se você tiver dúvidas ou deseja apresentar reclamação sobre o tratamento de seus dados:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>DPO AloClínica:</strong> {COMPLIANCE.emailDpo}</li>
          <li><strong>ANPD (Autoridade Nacional de Proteção de Dados):</strong> <a href="https://www.gov.br/anpd" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.gov.br/anpd</a></li>
        </ul>

        <div className="mt-10 p-4 rounded-xl bg-muted text-xs text-muted-foreground">
          <p>Este documento foi elaborado em conformidade com a Lei nº 13.709/2018 (LGPD), regulamentações da ANPD e melhores práticas de proteção de dados pessoais aplicáveis ao setor de saúde digital.</p>
        </div>
      </div>
      </div>
    </div>
  </div>
);

export default LGPD;
