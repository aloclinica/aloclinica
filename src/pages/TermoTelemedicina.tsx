import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function TermoTelemedicina() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="flex items-center gap-1 text-sm text-primary hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Termo de Consentimento — Telemedicina</h1>
            <p className="text-xs text-muted-foreground">Versão 2.0 — vigente desde 27/04/2026</p>
          </div>
        </div>

        <Card>
          <CardContent className="prose prose-sm max-w-none pt-6 space-y-4">
            <p className="text-amber-600 italic text-xs">
              Este termo é baseado na Resolução CFM 2.314/2022, Lei 14.510/2022 e LGPD (Lei 13.709/2018).
              Em caso de dúvidas, contate <a href="mailto:dpo@aloclinica.com.br" className="text-primary">dpo@aloclinica.com.br</a>.
            </p>

            <h2 className="text-lg font-semibold mt-6">1. Identificação</h2>
            <p>
              <strong>Plataforma:</strong> AloClínica — Telemedicina Digital<br />
              <strong>Site:</strong> https://aloclinica.com.br<br />
              <strong>Contato DPO (LGPD):</strong> dpo@aloclinica.com.br<br />
              <strong>Suporte:</strong> suporte@aloclinica.com.br
            </p>

            <h2 className="text-lg font-semibold mt-6">2. Objeto</h2>
            <p>
              Este termo formaliza o <strong>consentimento livre, expresso e esclarecido</strong> para receber atendimento médico
              à distância, em conformidade com a Lei 14.510/2022, Resolução CFM 2.314/2022, Resolução CFM 2.299/2021 e LGPD.
            </p>

            <h2 className="text-lg font-semibold mt-6">3. Modalidades de telemedicina disponíveis</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Teleconsulta:</strong> consulta médica realizada por videoconferência em tempo real</li>
              <li><strong>Teleinterconsulta:</strong> segunda opinião entre profissionais</li>
              <li><strong>Telediagnóstico:</strong> análise de exames à distância</li>
              <li><strong>Telemonitoramento:</strong> acompanhamento remoto</li>
              <li><strong>Teleorientação / Triagem:</strong> orientação inicial não-clínica</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6">4. Limitações e condições</h2>
            <p>O paciente está ciente de que:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>O paciente tem <strong>direito a atendimento presencial</strong> sempre que preferir ou quando houver indicação médica (Art. 19, CFM 2.314/2022); a teleconsulta <strong>NÃO substitui</strong> a consulta presencial nessas situações.</li>
              <li>Ao aceitar, o paciente <strong>autoriza o atendimento por telemedicina e a transmissão</strong> de imagens, áudio, vídeo e dados clínicos necessários ao atendimento (Art. 15, CFM 2.314/2022).</li>
              <li>Em caso de <strong>emergência</strong>, deve procurar atendimento presencial imediato (SAMU 192 ou pronto-socorro).</li>
              <li>O médico pode <strong>encaminhar para atendimento presencial</strong> se julgar necessário.</li>
              <li>A qualidade da consulta depende da conexão à internet e do dispositivo utilizado.</li>
              <li>Receitas e atestados são emitidos digitalmente, com assinatura eletrônica válida (Lei 14.063/2020) ou ICP-Brasil.</li>
              <li>Receitas de medicamentos controlados (psicotrópicos, opioides, etc) requerem certificado ICP-Brasil do médico.</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6">5. Privacidade e proteção de dados (LGPD)</h2>
            <p>O tratamento de dados pessoais e de saúde é autorizado para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Realização de consultas, emissão de receitas e atestados</li>
              <li>Manutenção de prontuário médico (retenção de <strong>20 anos</strong> conforme Resolução CFM 1.821/2007)</li>
              <li>Cumprimento de obrigações legais e regulatórias</li>
              <li>Envio de lembretes e comunicações sobre as consultas</li>
            </ul>
            <p>
              <strong>Compartilhamento:</strong> dados podem ser compartilhados apenas com o médico atendente,
              plataforma de pagamento (Asaas) e autoridades quando exigido por lei.
            </p>
            <p>
              <strong>Direito de negar (Art. 15, §único, CFM 2.314/2022):</strong> o paciente tem o direito de
              negar a permissão de compartilhamento dos seus dados pessoais e de saúde, exceto em caso de
              <strong> emergência médica</strong>, quando o compartilhamento independe de autorização.
            </p>
            <p>
              <strong>Armazenamento:</strong> servidores no Brasil (LGPD-compliant), com criptografia em trânsito (TLS 1.3) e em repouso (AES-256).
            </p>
            <p><strong>Direitos LGPD:</strong> confirmação, acesso, correção, anonimização, portabilidade, eliminação, informação sobre compartilhamentos, revogação de consentimento.</p>

            <h2 className="text-lg font-semibold mt-6">6. Gravação e compartilhamento</h2>
            <p>
              A teleconsulta poderá ser gravada apenas com consentimento expresso prévio (botão exibido antes da chamada)
              e para finalidade clínica legítima. Nunca para finalidade comercial sem nova autorização específica.
            </p>

            <h2 className="text-lg font-semibold mt-6">7. Pagamento</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Valores das consultas são informados antes de cada agendamento.</li>
              <li>Pagamento processado pela <strong>Asaas</strong> (PSP licenciado pelo BACEN).</li>
              <li>No-show (sem cancelamento com 2h de antecedência): taxa de <strong>50%</strong> do valor.</li>
              <li>Reembolsos seguem o Código de Defesa do Consumidor.</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6">8. Responsabilidade do médico</h2>
            <p>
              O médico atendente possui CRM ativo e regular, foi previamente verificado pela AloClínica
              e responde tecnicamente conforme o Código de Ética Médica. Pode optar por não realizar a teleconsulta
              se julgar que o caso exige presencial.
            </p>

            <h2 className="text-lg font-semibold mt-6">9. Limitações de responsabilidade da plataforma</h2>
            <p>A AloClínica é responsável pela disponibilidade técnica (SLA 99% mensal) e segurança dos dados.
              NÃO é responsável pela conduta médica individual, falhas de conexão do paciente, nem perda de
              oportunidade clínica decorrente de informação incompleta fornecida pelo paciente.</p>

            <h2 className="text-lg font-semibold mt-6">10. Aceite eletrônico</h2>
            <p>Ao clicar em <strong>"Concordo com o Termo"</strong> antes de cada consulta, o paciente:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Declara ter lido e compreendido integralmente este termo</li>
              <li>Manifesta consentimento livre, expresso e esclarecido</li>
              <li>Autoriza o tratamento de dados nos termos da LGPD</li>
              <li>Aceita as condições de uso da AloClínica</li>
            </ul>
            <p>
              O aceite é registrado com data/hora UTC, IP, User-Agent, versão do termo e hash criptográfico.
              Armazenado por 20 anos e disponível no painel <code>/dashboard/privacidade</code>.
            </p>

            <hr className="my-6" />
            <p className="text-xs text-muted-foreground">
              Versão 2.0 — Em caso de atualização, será exibido novo aceite ao paciente.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
