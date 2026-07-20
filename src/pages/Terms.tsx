import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import InstitutionalHero from "@/components/landing/InstitutionalHero";
import { COMPLIANCE } from "@/config/compliance";

const Terms = () => (
  <div className="min-h-screen relative">
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(220,60%,96%)] via-[hsl(230,40%,93%)] to-[hsl(250,35%,90%)] dark:from-[hsl(220,30%,8%)] dark:via-[hsl(230,25%,10%)] dark:to-[hsl(250,20%,12%)]" />
    <SEOHead title="Termos de Uso" description="Termos de uso da plataforma AloClinica de telemedicina." canonical={`${COMPLIANCE.site}/termos`} />

    <InstitutionalHero title="Termos de Uso" icon={FileText} lastUpdate={COMPLIANCE.ultimaAtualizacaoLegal} />

    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">

        <h2 className="text-xl font-bold text-foreground mt-8">1. Aceitação dos Termos</h2>
        <p>Ao acessar, cadastrar-se ou utilizar de qualquer forma a plataforma AloClinica (doravante "Plataforma"), disponível via web e aplicativos, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso. Caso não concorde com quaisquer condições aqui estabelecidas, deverá interromper imediatamente o uso da Plataforma.</p>
        <p>Estes Termos constituem um contrato vinculante entre o usuário e a <strong>{COMPLIANCE.razaoSocial}</strong>, inscrita no CNPJ sob nº {COMPLIANCE.cnpj}, com sede em {COMPLIANCE.enderecoSede}. A responsabilidade técnica médica da Plataforma é da {COMPLIANCE.diretorTecnicoMedico} ({COMPLIANCE.diretorTecnicoCRM}).</p>

        <h2 className="text-xl font-bold text-foreground mt-6">2. Definições</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Plataforma:</strong> sistema eletrônico de telemedicina AloClinica, incluindo site, aplicativos, APIs e serviços associados.</li>
          <li><strong>Paciente:</strong> pessoa física que se cadastra para buscar atendimento médico por teleconsulta.</li>
          <li><strong>Médico:</strong> profissional de saúde devidamente registrado no CRM, cadastrado e aprovado na Plataforma.</li>
          <li><strong>Teleconsulta:</strong> consulta médica realizada por meio de videochamada através da Plataforma.</li>
          <li><strong>Prontuário Eletrônico:</strong> conjunto de dados e informações de saúde do paciente armazenados eletronicamente.</li>
          <li><strong>Receita Digital:</strong> prescrição médica emitida em formato digital conforme regulamentação vigente.</li>
          <li><strong>Clínica:</strong> pessoa jurídica do ramo de saúde que utiliza a Plataforma para gerenciar atendimentos.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-6">3. Descrição do Serviço</h2>
        <p>A AloClinica é uma plataforma de telemedicina que conecta pacientes a médicos para a realização de consultas por videochamada em tempo real, em conformidade com a Resolução CFM nº 2.314/2022 e a Lei nº 14.510/2022 que regulamenta a telemedicina no Brasil.</p>
        <p>Através da Plataforma, os usuários podem:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Agendar e realizar consultas médicas por videochamada;</li>
          <li>Receber receitas e atestados digitais válidos em todo território nacional;</li>
          <li>Armazenar e consultar seu histórico de saúde e prontuário eletrônico;</li>
          <li>Enviar e receber exames e documentos médicos;</li>
          <li>Gerenciar dependentes (menores de idade e tutelados);</li>
          <li>Contratar planos de assinatura com benefícios diferenciados.</li>
        </ul>
        <p className="font-medium text-foreground">A AloClinica NÃO substitui o atendimento presencial de emergência. Em caso de emergência médica, o paciente deve ligar para o SAMU (192) ou se dirigir ao pronto-socorro mais próximo.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">4. Cadastro e Conta do Usuário</h2>
        <p>4.1. Para utilizar a Plataforma, o usuário deve criar uma conta fornecendo informações verdadeiras, completas e atualizadas, incluindo: nome completo, CPF, e-mail, data de nascimento e telefone.</p>
        <p>4.2. O usuário é integralmente responsável pela confidencialidade de suas credenciais de acesso (e-mail e senha), comprometendo-se a não compartilhá-las com terceiros.</p>
        <p>4.3. Informações falsas, incompletas ou fraudulentas podem resultar no cancelamento imediato da conta, sem direito a reembolso de valores pagos.</p>
        <p>4.4. Menores de 18 anos somente poderão utilizar a Plataforma como dependentes de um usuário maior de idade, que se responsabilizará por todas as interações.</p>
        <p>4.5. A AloClinica se reserva o direito de verificar a identidade dos usuários através de mecanismos de validação de CPF e documentos.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">5. Consultas Médicas e Teleconsulta</h2>
        <p>5.1. Todas as consultas são realizadas exclusivamente por médicos devidamente registrados no Conselho Regional de Medicina (CRM) de seu estado, com verificação ativa de regularidade do registro profissional.</p>
        <p>5.2. Antes de cada teleconsulta, o paciente deve aceitar o Termo de Consentimento Livre e Esclarecido (TCLE), em conformidade com a Resolução CFM nº 2.314/2022, autorizando o atendimento por telemedicina.</p>
        <p>5.3. Receitas médicas e atestados são emitidos digitalmente com assinatura eletrônica do médico, conforme legislação vigente (Lei nº 14.063/2020). Esses documentos possuem validade em todo o território nacional.</p>
        <p>5.4. O médico tem autonomia para decidir se o caso é adequado para teleconsulta ou se exige atendimento presencial, podendo encerrar a consulta e orientar o paciente a buscar atendimento presencial.</p>
        <p>5.5. O tempo médio de duração de cada consulta é definido pelo médico, sendo o mínimo de 10 minutos.</p>
        <p>5.6. A gravação das teleconsultas é expressamente proibida por ambas as partes, salvo autorização prévia e expressa de todos os participantes.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">6. Consultas de Retorno</h2>
        <p>6.1. O médico pode indicar a necessidade de retorno, definindo um prazo (geralmente 15 dias) para que o paciente agende uma nova consulta sem custo adicional.</p>
        <p>6.2. A consulta de retorno deverá ser agendada dentro do prazo estipulado e com o mesmo médico que realizou a consulta original.</p>
        <p>6.3. Caso o prazo de retorno expire, a consulta será cobrada normalmente como uma nova consulta.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">7. Planos, Pagamentos e Preços</h2>
        <p>7.1. A AloClinica oferece diferentes modalidades de contratação:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Consulta Avulsa:</strong> pagamento único por consulta realizada;</li>
          <li><strong>Plano Mensal/Anual:</strong> assinatura com número definido de consultas incluídas e benefícios adicionais;</li>
          <li><strong>Plano Familiar:</strong> cobertura para o titular e dependentes.</li>
        </ul>
        <p>7.2. Os valores dos planos e consultas avulsas são informados de forma clara antes da contratação, incluindo eventuais taxas e impostos aplicáveis.</p>
        <p>7.3. Os pagamentos são processados por meio da plataforma de pagamento {COMPLIANCE.provedorPagamento} (instituição de pagamento autorizada pelo Banco Central), estando sujeitos às políticas dessa plataforma. O valor da consulta é sempre validado no servidor da AloClinica no momento da cobrança.</p>
        <p>7.4. A AloClinica se reserva o direito de alterar os preços dos planos a qualquer momento, garantindo que as alterações não afetarão assinaturas vigentes até a próxima renovação.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">8. Política de Cancelamento e Reembolso</h2>
        <p>8.1. <strong>Cancelamento pelo paciente:</strong> cancelamentos feitos pelo paciente não geram reembolso.</p>
        <p>8.2. <strong>Cancelamento ou não comparecimento pelo médico:</strong> o paciente será integralmente reembolsado. A plataforma tentará automaticamente reatribuir a consulta a outro médico disponível.</p>
        <p>8.3. <strong>Cancelamento de plano:</strong> planos de assinatura podem ser cancelados a qualquer momento, sendo o acesso mantido até o final do período já pago. Não há reembolso proporcional pelo período não utilizado.</p>
        <p>8.4. <strong>Direito de arrependimento:</strong> conforme o Código de Defesa do Consumidor (Art. 49), o paciente tem direito ao arrependimento e reembolso integral em até 7 dias após a primeira contratação, desde que nenhuma consulta tenha sido realizada.</p>
        <p>Para mais detalhes, consulte nossa <Link to="/refund" className="text-primary hover:underline">Política de Reembolso completa</Link>.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">9. Prontuário Eletrônico e Dados de Saúde</h2>
        <p>9.1. O prontuário eletrônico do paciente é armazenado de forma segura e criptografada, em conformidade com a Resolução CFM nº 1.638/2002 e a LGPD (Lei nº 13.709/2018).</p>
        <p>9.2. Os prontuários médicos são mantidos pelo prazo mínimo de 20 anos, conforme determinação do Conselho Federal de Medicina.</p>
        <p>9.3. O acesso ao prontuário é restrito ao paciente e aos médicos que o atenderem, sendo vedado o compartilhamento com terceiros sem autorização expressa do paciente.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">10. Obrigações dos Médicos</h2>
        <p>10.1. Os médicos cadastrados na Plataforma devem manter seu registro no CRM ativo e regular durante todo o período de utilização.</p>
        <p>10.2. Os médicos são integralmente responsáveis por seus diagnósticos, prescrições e orientações médicas, sendo a relação médico-paciente de responsabilidade exclusiva das partes.</p>
        <p>10.3. Os médicos devem seguir as diretrizes éticas do Código de Ética Médica e as normativas do CFM aplicáveis à telemedicina.</p>
        <p>Para termos específicos dos médicos, consulte os <Link to="/doctor-terms" className="text-primary hover:underline">Termos de Uso para Médicos</Link>.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">11. Propriedade Intelectual</h2>
        <p>11.1. Todo o conteúdo da Plataforma (textos, imagens, logotipos, software, design, interface) é propriedade da AloClinica ou de seus licenciadores, protegido pelas leis de propriedade intelectual.</p>
        <p>11.2. É proibida a reprodução, modificação, distribuição ou utilização comercial de qualquer conteúdo da Plataforma sem autorização prévia e expressa da AloClinica.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">12. Limitação de Responsabilidade</h2>
        <p>12.1. A AloClinica atua como intermediadora tecnológica entre pacientes e médicos, não praticando atos médicos nem sendo responsável por diagnósticos, tratamentos ou prescrições.</p>
        <p>12.2. A Plataforma não se responsabiliza por interrupções no serviço decorrentes de falhas na conexão de internet do usuário, problemas de hardware ou circunstâncias de força maior.</p>
        <p>12.3. A responsabilidade total da AloClinica, em qualquer hipótese, fica limitada ao valor pago pelo usuário nos últimos 12 meses.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">13. Privacidade e Proteção de Dados</h2>
        <p>O tratamento de dados pessoais segue rigorosamente a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Para informações detalhadas sobre como coletamos, utilizamos e protegemos seus dados, consulte nossa <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link> e nossa <Link to="/lgpd" className="text-primary hover:underline">Política de Conformidade LGPD</Link>.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">14. Cookies</h2>
        <p>A Plataforma utiliza cookies conforme descrito em nossa <Link to="/cookies" className="text-primary hover:underline">Política de Cookies</Link>.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">15. Modificações nos Termos</h2>
        <p>15.1. A AloClinica se reserva o direito de modificar estes Termos a qualquer momento.</p>
        <p>15.2. Alterações significativas serão comunicadas aos usuários com antecedência mínima de 30 dias por e-mail e/ou notificação na Plataforma.</p>
        <p>15.3. O uso continuado da Plataforma após a notificação constitui aceitação tácita dos novos termos.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">16. Legislação Aplicável e Foro</h2>
        <p>16.1. Estes Termos são regidos pelas leis da República Federativa do Brasil.</p>
        <p>16.2. Fica eleito o Foro da {COMPLIANCE.foroComarca} para dirimir quaisquer questões oriundas destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">17. Contato</h2>
        <p>Para dúvidas, sugestões ou reclamações sobre estes Termos:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>E-mail:</strong> {COMPLIANCE.emailContato}</li>
          <li><strong>Suporte:</strong> {COMPLIANCE.emailSuporte}</li>
          <li><strong>Encarregado de Dados (DPO):</strong> {COMPLIANCE.emailDpo}</li>
          <li><strong>Responsável Técnico Médico:</strong> {COMPLIANCE.diretorTecnicoMedico} ({COMPLIANCE.diretorTecnicoCRM}) — {COMPLIANCE.contatoTecnico}</li>
        </ul>

        <div className="mt-10 p-4 rounded-xl bg-muted text-xs text-muted-foreground">
          <p>Documento criado em conformidade com: Código de Defesa do Consumidor (Lei nº 8.078/1990), Marco Civil da Internet (Lei nº 12.965/2014), Lei Geral de Proteção de Dados (Lei nº 13.709/2018), Lei de Telemedicina (Lei nº 14.510/2022) e Resolução CFM nº 2.314/2022.</p>
        </div>
      </div>
    </div>
  </div>
);

export default Terms;
