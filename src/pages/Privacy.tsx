import { Link } from "react-router-dom";
import { Shield, BookOpen } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import InstitutionalHero from "@/components/landing/InstitutionalHero";
import { COMPLIANCE } from "@/config/compliance";

const tocItems = [
  { id: "dados-coletados", label: "1. Dados Coletados" },
  { id: "finalidades", label: "2. Finalidades" },
  { id: "compartilhamento", label: "3. Compartilhamento" },
  { id: "seguranca", label: "4. Segurança" },
  { id: "retencao", label: "5. Retenção" },
  { id: "direitos", label: "6. Seus Direitos" },
  { id: "transferencia", label: "7. Transferência Internacional" },
  { id: "cookies", label: "8. Cookies" },
  { id: "alteracoes", label: "9. Alterações" },
  { id: "contato", label: "10. Contato do DPO" },
];

const Privacy = () => (
  <div className="min-h-screen relative">
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(160,50%,96%)] via-[hsl(170,40%,92%)] to-[hsl(180,35%,88%)] dark:from-[hsl(160,30%,8%)] dark:via-[hsl(170,25%,10%)] dark:to-[hsl(180,20%,12%)]" />
    <SEOHead title="Política de Privacidade" description="Saiba como a AloClinica coleta, usa e protege seus dados pessoais." canonical={`${COMPLIANCE.site}/privacidade`} />

    <InstitutionalHero title="Política de Privacidade" subtitle="Proteção de dados é prioridade" icon={Shield} lastUpdate={COMPLIANCE.ultimaAtualizacaoLegal} />

    <div className="container mx-auto px-4 py-12 max-w-6xl grid lg:grid-cols-[240px_1fr] gap-10">
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
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">

        <p>A <strong>{COMPLIANCE.razaoSocial}</strong> (CNPJ {COMPLIANCE.cnpj}, sede em {COMPLIANCE.enderecoSede}), operadora da plataforma AloClínica ("AloClínica", "nós"), está comprometida com a proteção da sua privacidade e dos seus dados pessoais. Esta Política descreve como coletamos, usamos, armazenamos, compartilhamos e protegemos suas informações em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Responsável Técnica Médica: {COMPLIANCE.diretorTecnicoMedico} ({COMPLIANCE.diretorTecnicoCRM}).</p>

        <h2 id="dados-coletados" className="text-xl font-bold text-foreground mt-8 scroll-mt-24">1. Dados Pessoais Coletados</h2>
        <p>Coletamos diferentes categorias de dados pessoais dependendo da sua interação com a Plataforma:</p>
        <h3 className="text-base font-semibold text-foreground mt-4">1.1. Dados de Cadastro</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Nome completo, CPF, data de nascimento;</li>
          <li>E-mail e número de telefone;</li>
          <li>Endereço residencial (quando necessário);</li>
          <li>Foto de perfil (opcional).</li>
        </ul>
        <h3 className="text-base font-semibold text-foreground mt-4">1.2. Dados Sensíveis de Saúde</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Informações relatadas durante as consultas médicas;</li>
          <li>Histórico médico, alergias e condições crônicas;</li>
          <li>Prescrições médicas e receitas emitidas;</li>
          <li>Exames e documentos médicos enviados à Plataforma;</li>
          <li>Tipo sanguíneo e dados de sinais vitais;</li>
          <li>Sintomas de pré-consulta registrados pelo paciente.</li>
        </ul>
        <h3 className="text-base font-semibold text-foreground mt-4">1.3. Dados de Uso e Navegação</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Endereço IP, tipo de navegador e dispositivo;</li>
          <li>Páginas visitadas, tempo de permanência e cliques;</li>
          <li>Registros de entrada e saída da sala de videoconsulta (logs de presença);</li>
          <li>Dados de cookies conforme nossa <Link to="/cookies" className="text-primary hover:underline">Política de Cookies</Link>.</li>
        </ul>
        <h3 className="text-base font-semibold text-foreground mt-4">1.4. Dados de Pagamento</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Dados transacionais processados por plataformas de pagamento terceirizadas;</li>
          <li>Histórico de pagamentos e assinaturas;</li>
          <li>Nota: não armazenamos números de cartão de crédito diretamente em nossos servidores.</li>
        </ul>

        <h2 id="finalidades" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">2. Finalidades do Tratamento</h2>
        <table className="w-full text-xs border-collapse mt-2">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-left text-foreground">Finalidade</th>
              <th className="border border-border p-2 text-left text-foreground">Base Legal (LGPD)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="border border-border p-2">Prestação de serviços médicos e teleconsulta</td><td className="border border-border p-2">Execução de contrato (Art. 7º, V)</td></tr>
            <tr><td className="border border-border p-2">Emissão de receitas e atestados digitais</td><td className="border border-border p-2">Obrigação legal (Art. 7º, II)</td></tr>
            <tr><td className="border border-border p-2">Armazenamento de prontuário eletrônico</td><td className="border border-border p-2">Obrigação legal/regulatória (Art. 7º, II)</td></tr>
            <tr><td className="border border-border p-2">Tratamento de dados sensíveis de saúde</td><td className="border border-border p-2">Tutela da saúde (Art. 11, II, f)</td></tr>
            <tr><td className="border border-border p-2">Processamento de pagamentos</td><td className="border border-border p-2">Execução de contrato (Art. 7º, V)</td></tr>
            <tr><td className="border border-border p-2">Envio de notificações sobre consultas</td><td className="border border-border p-2">Execução de contrato (Art. 7º, V)</td></tr>
            <tr><td className="border border-border p-2">Comunicações de marketing</td><td className="border border-border p-2">Consentimento (Art. 7º, I)</td></tr>
            <tr><td className="border border-border p-2">Registro de logs de presença em videoconsulta</td><td className="border border-border p-2">Interesse legítimo (Art. 7º, IX)</td></tr>
            <tr><td className="border border-border p-2">Prevenção a fraudes</td><td className="border border-border p-2">Interesse legítimo (Art. 7º, IX)</td></tr>
            <tr><td className="border border-border p-2">Melhoria contínua da Plataforma</td><td className="border border-border p-2">Interesse legítimo (Art. 7º, IX)</td></tr>
          </tbody>
        </table>

        <h2 id="compartilhamento" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">3. Compartilhamento de Dados</h2>
        <p>Seus dados pessoais poderão ser compartilhados nas seguintes situações:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Médico ↔ Paciente:</strong> dados de saúde são compartilhados exclusivamente entre o paciente e o médico responsável pelo atendimento;</li>
          <li><strong>Processadores de pagamento:</strong> dados transacionais são compartilhados com o {COMPLIANCE.provedorPagamento} (instituição de pagamento autorizada pelo Banco Central) para processamento;</li>
          <li><strong>Infraestrutura em nuvem:</strong> dados são armazenados em servidores seguros do {COMPLIANCE.provedorInfra} (banco de dados, autenticação e arquivos);</li>
          <li><strong>Autoridades judiciais:</strong> mediante ordem judicial ou obrigação legal;</li>
          <li><strong>Clínicas parceiras:</strong> quando a consulta for intermediada por uma clínica cadastrada.</li>
        </ul>
        <p className="font-medium text-foreground">Jamais vendemos, alugamos ou comercializamos dados pessoais a terceiros para fins de marketing.</p>

        <h2 id="seguranca" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">4. Segurança dos Dados</h2>
        <p>Adotamos medidas técnicas e organizacionais rigorosas para proteger seus dados:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Criptografia em trânsito (TLS/HTTPS) e em repouso;</li>
          <li>Videochamadas criptografadas de ponta a ponta;</li>
          <li>Controle de acesso baseado em papéis (RBAC) com Row Level Security;</li>
          <li>Autenticação multi-fator disponível para todas as contas;</li>
          <li>Logs de auditoria para rastreamento de acessos;</li>
          <li>Backups automatizados e redundantes;</li>
          <li>Monitoramento contínuo de vulnerabilidades.</li>
        </ul>

        <h2 id="retencao" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">5. Retenção de Dados</h2>
        <table className="w-full text-xs border-collapse mt-2">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-left text-foreground">Tipo de Dado</th>
              <th className="border border-border p-2 text-left text-foreground">Prazo</th>
              <th className="border border-border p-2 text-left text-foreground">Fundamentação</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="border border-border p-2">Prontuário médico</td><td className="border border-border p-2">20 anos</td><td className="border border-border p-2">Resolução CFM nº 1.821/2007</td></tr>
            <tr><td className="border border-border p-2">Dados de cadastro</td><td className="border border-border p-2">Enquanto a conta estiver ativa</td><td className="border border-border p-2">Execução de contrato</td></tr>
            <tr><td className="border border-border p-2">Dados de pagamento</td><td className="border border-border p-2">5 anos após a transação</td><td className="border border-border p-2">Legislação tributária</td></tr>
            <tr><td className="border border-border p-2">Logs de presença em vídeo</td><td className="border border-border p-2">5 anos</td><td className="border border-border p-2">Proteção contra disputas</td></tr>
            <tr><td className="border border-border p-2">Logs de navegação</td><td className="border border-border p-2">6 meses</td><td className="border border-border p-2">Marco Civil da Internet</td></tr>
            <tr><td className="border border-border p-2">Cookies analíticos</td><td className="border border-border p-2">12 meses</td><td className="border border-border p-2">Consentimento</td></tr>
          </tbody>
        </table>

        <h2 id="direitos" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">6. Direitos do Titular dos Dados</h2>
        <p>Nos termos da LGPD, você tem direito a:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Confirmação e acesso:</strong> saber se tratamos seus dados e acessá-los;</li>
          <li><strong>Correção:</strong> solicitar a retificação de dados incompletos ou desatualizados;</li>
          <li><strong>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários ou tratados em desconformidade;</li>
          <li><strong>Portabilidade:</strong> transferir seus dados a outro prestador de serviço;</li>
          <li><strong>Eliminação:</strong> dos dados tratados com base no consentimento;</li>
          <li><strong>Revogação do consentimento:</strong> a qualquer momento, sem afetar tratamentos anteriores;</li>
          <li><strong>Oposição:</strong> ao tratamento realizado com fundamento em interesse legítimo.</li>
        </ul>
        <p>Para exercer seus direitos, entre em contato com nosso Encarregado de Dados (DPO) pelo e-mail: <strong>{COMPLIANCE.emailDpo}</strong>. As solicitações serão atendidas em até 15 dias úteis.</p>

        <h2 id="transferencia" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">7. Transferência Internacional de Dados</h2>
        <p>Alguns de nossos prestadores de serviço (infraestrutura em nuvem, processamento de pagamentos) podem estar localizados fora do Brasil. Nestes casos, garantimos que a transferência ocorre com proteções adequadas conforme Art. 33 da LGPD.</p>

        <h2 id="cookies" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">8. Cookies</h2>
        <p>Utilizamos cookies essenciais e analíticos conforme descrito em nossa <Link to="/cookies" className="text-primary hover:underline">Política de Cookies</Link>.</p>

        <h2 id="alteracoes" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">9. Alterações nesta Política</h2>
        <p>Quaisquer alterações significativas serão comunicadas com antecedência de 30 dias. A versão mais atual estará sempre disponível em <Link to="/privacy" className="text-primary hover:underline">aloclinica.com.br/privacy</Link>.</p>

        <h2 id="contato" className="text-xl font-bold text-foreground mt-6 scroll-mt-24">10. Contato do DPO</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Encarregado de Dados (DPO):</strong> {COMPLIANCE.emailDpo}</li>
          <li><strong>Controladora:</strong> {COMPLIANCE.razaoSocial} — CNPJ {COMPLIANCE.cnpj} — {COMPLIANCE.enderecoSede}</li>
          <li><strong>Autoridade Nacional de Proteção de Dados (ANPD):</strong> <a href="https://www.gov.br/anpd" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.gov.br/anpd</a></li>
        </ul>

        <div className="mt-10 p-4 rounded-xl bg-muted text-xs text-muted-foreground">
          <p>Esta Política foi elaborada em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), Marco Civil da Internet (Lei nº 12.965/2014), Resolução CFM nº 2.314/2022 e as melhores práticas internacionais de proteção de dados (GDPR como referência).</p>
        </div>
      </div>
      </div>
    </div>
  </div>
);

export default Privacy;
