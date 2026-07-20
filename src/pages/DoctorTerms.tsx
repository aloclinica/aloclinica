import { Link } from "react-router-dom";
import { Stethoscope } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import InstitutionalHero from "@/components/landing/InstitutionalHero";
import { COMPLIANCE } from "@/config/compliance";

const DoctorTerms = () => (
  <div className="min-h-screen relative">
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(190,50%,96%)] via-[hsl(200,45%,92%)] to-[hsl(210,40%,87%)] dark:from-[hsl(190,25%,8%)] dark:via-[hsl(200,22%,10%)] dark:to-[hsl(210,20%,12%)]" />
    <SEOHead title="Termos de Uso para Médicos" description="Termos e condições para médicos cadastrados na AloClinica." />
    
    <InstitutionalHero title="Termos de Uso para Médicos" subtitle="Diretrizes para profissionais" icon={Stethoscope} lastUpdate={COMPLIANCE.ultimaAtualizacaoLegal} />

    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">

        <p>Estes Termos complementam os <Link to="/terms" className="text-primary hover:underline">Termos de Uso Gerais</Link> e aplicam-se especificamente aos profissionais médicos cadastrados na Plataforma AloClinica.</p>

        <h2 className="text-xl font-bold text-foreground mt-8">1. Requisitos de Cadastro</h2>
        <p>Para se cadastrar como médico na AloClinica, o profissional deve:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Possuir registro ativo e regular no Conselho Regional de Medicina (CRM) do estado de exercício;</li>
          <li>Apresentar código de convite fornecido pela AloClinica ou por médico já cadastrado;</li>
          <li>Informar CRM, estado do CRM, especialidades e formação acadêmica;</li>
          <li>Aguardar aprovação administrativa após verificação do registro profissional.</li>
        </ul>
        <p>A AloClinica se reserva o direito de rejeitar cadastros ou revogar aprovações caso sejam identificadas irregularidades no registro profissional.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">2. Verificação do CRM</h2>
        <p>2.1. A AloClinica realiza verificação do registro no CRM durante o processo de aprovação e periodicamente durante a vigência do cadastro.</p>
        <p>2.2. Caso o CRM do médico seja suspenso, cassado ou fique irregular, o acesso à Plataforma será imediatamente suspenso.</p>
        <p>2.3. O médico é obrigado a informar imediatamente qualquer alteração em seu registro profissional.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">3. Obrigações do Médico</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Realizar teleconsultas em conformidade com a Resolução CFM nº 2.314/2022 e o Código de Ética Médica;</li>
          <li>Preencher corretamente o prontuário eletrônico de cada paciente atendido;</li>
          <li>Emitir receitas e atestados digitais válidos quando necessário;</li>
          <li>Avaliar se o caso é adequado para teleconsulta, encaminhando para atendimento presencial quando necessário;</li>
          <li>Manter sigilo médico absoluto sobre as informações dos pacientes;</li>
          <li>Não gravar teleconsultas sem consentimento expresso de todas as partes;</li>
          <li>Comparecer aos horários agendados ou cancelar com antecedência mínima de 4 horas;</li>
          <li>Manter seus dados cadastrais e disponibilidade atualizados na Plataforma.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-6">4. Remuneração e Repasses</h2>
        <p>4.1. O valor por consulta é definido pelo médico, respeitando os limites mínimos e máximos estabelecidos pela Plataforma.</p>
        <p>4.2. A AloClinica retém uma comissão sobre cada consulta realizada, conforme tabela vigente comunicada ao médico no momento do cadastro.</p>
        <p>4.3. Os repasses são realizados mensalmente, mediante solicitação de saque pelo painel do médico, via PIX ou transferência bancária.</p>
        <p>4.4. Para médicos vinculados a clínicas parceiras, a comissão da clínica é descontada conforme contrato de afiliação.</p>
        <p>4.5. Notas fiscais e comprovantes de repasse ficam disponíveis no painel financeiro do médico.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">5. Consultas de Retorno</h2>
        <p>5.1. O médico pode indicar a necessidade de retorno, definindo um prazo (padrão de 15 dias) no sistema.</p>
        <p>5.2. Consultas de retorno dentro do prazo são gratuitas para o paciente e não geram remuneração adicional ao médico.</p>
        <p>5.3. O sistema automaticamente desabilita o retorno gratuito após a expiração do prazo.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">6. Disponibilidade e Agenda</h2>
        <p>6.1. O médico é responsável por configurar e manter atualizada sua agenda de disponibilidade.</p>
        <p>6.2. O recurso "Disponível Agora" (plantão) permite que o médico apareça em destaque para pacientes buscando atendimento imediato.</p>
        <p>6.3. Faltas recorrentes sem aviso podem resultar em suspensão temporária ou permanente do cadastro.</p>
        <p>6.4. O médico pode cadastrar ausências programadas (férias, congressos) antecipadamente pelo painel.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">7. Prontuário Eletrônico</h2>
        <p>7.1. O médico deve registrar todas as informações relevantes no prontuário eletrônico do paciente, incluindo: anamnese, diagnósticos, prescrições e orientações.</p>
        <p>7.2. O prontuário é armazenado pela AloClínica pelo prazo mínimo de 20 anos conforme Resolução CFM nº 1.821/2007.</p>
        <p>7.3. O médico pode acessar prontuários apenas de pacientes que atendeu ou está atendendo.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">8. Responsabilidade Profissional</h2>
        <p>8.1. A relação médico-paciente é de responsabilidade exclusiva do médico. A AloClinica atua apenas como intermediadora tecnológica.</p>
        <p>8.2. O médico é integralmente responsável por seus diagnósticos, prescrições e orientações.</p>
        <p>8.3. O médico deve possuir seguro de responsabilidade civil profissional vigente.</p>
        <p>8.4. A AloClinica não interfere na autonomia médica, respeitando as diretrizes éticas do CFM.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">9. Avaliações e Qualidade</h2>
        <p>9.1. Pacientes podem avaliar o médico após cada consulta (nota e comentário).</p>
        <p>9.2. A nota média é exibida publicamente no perfil do médico.</p>
        <p>9.3. Médicos com avaliações consistentemente baixas poderão ser contatados para orientação ou, em casos extremos, ter o cadastro suspenso.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">10. Rescisão</h2>
        <p>10.1. O médico pode solicitar o encerramento do cadastro a qualquer momento, sendo obrigado a concluir consultas já agendadas.</p>
        <p>10.2. A AloClinica pode suspender ou encerrar o cadastro do médico nos seguintes casos:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Irregularidade no CRM;</li>
          <li>Violação do Código de Ética Médica;</li>
          <li>Reclamações graves comprovadas de pacientes;</li>
          <li>Faltas recorrentes sem justificativa;</li>
          <li>Uso da plataforma para fins ilícitos.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-6">11. Contato</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Suporte ao médico:</strong> {COMPLIANCE.emailMedicos}</li>
          <li><strong>Responsável Técnico Médico:</strong> {COMPLIANCE.diretorTecnicoMedico} ({COMPLIANCE.diretorTecnicoCRM}) — {COMPLIANCE.contatoTecnico}</li>
        </ul>

        <div className="mt-10 p-4 rounded-xl bg-muted text-xs text-muted-foreground">
          <p>Estes Termos estão em conformidade com o Código de Ética Médica (Resolução CFM nº 2.217/2018), Resolução CFM nº 2.314/2022 sobre Telemedicina e a legislação brasileira aplicável.</p>
        </div>
      </div>
    </div>
  </div>
);

export default DoctorTerms;
