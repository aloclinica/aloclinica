import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Ear, Hand, Monitor, Globe, MessageCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const Accessibility = () => (
  <div className="min-h-screen relative">
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(280,45%,97%)] via-[hsl(290,35%,93%)] to-[hsl(300,30%,89%)] dark:from-[hsl(280,25%,7%)] dark:via-[hsl(290,20%,9%)] dark:to-[hsl(300,18%,11%)]" />
    <SEOHead title="Acessibilidade" description="Conheça os recursos de acessibilidade da plataforma AloClinica." />
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar ao início
      </Link>
      <h1 className="text-3xl font-bold text-foreground mb-2">Declaração de Acessibilidade</h1>
      <p className="text-sm text-muted-foreground mb-8">Última atualização: Fevereiro de 2026</p>

      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {[
          { icon: Eye, title: "Visão", desc: "Alto contraste, redimensionamento de texto" },
          { icon: Ear, title: "Audição", desc: "Chat por texto durante consultas" },
          { icon: Hand, title: "Motor", desc: "Navegação completa por teclado" },
          { icon: Monitor, title: "Responsivo", desc: "Funciona em qualquer dispositivo" },
          { icon: Globe, title: "WCAG 2.1", desc: "Conformidade nível AA" },
          { icon: MessageCircle, title: "Feedback", desc: "Canal aberto para sugestões" },
        ].map((item, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">

        <h2 className="text-xl font-bold text-foreground">1. Nosso Compromisso</h2>
        <p>A AloClinica está comprometida em garantir que todos os usuários, independentemente de suas capacidades, possam acessar e utilizar a plataforma de forma plena e eficiente. Trabalhamos continuamente para alcançar conformidade com as Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.1, nível AA.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">2. Recursos de Acessibilidade Implementados</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Alto contraste:</strong> modo de alto contraste disponível no botão de acessibilidade flutuante;</li>
          <li><strong>Redimensionamento de texto:</strong> aumento de até 150% do tamanho padrão;</li>
          <li><strong>Navegação por teclado:</strong> todas as funcionalidades acessíveis via Tab, Enter e teclas de atalho;</li>
          <li><strong>Leitores de tela:</strong> HTML semântico, atributos ARIA e alt-text em imagens;</li>
          <li><strong>Modo escuro/claro:</strong> alternância de tema para conforto visual;</li>
          <li><strong>Design responsivo:</strong> interface adaptável a qualquer tamanho de tela;</li>
          <li><strong>Espaçamento ampliado:</strong> opção de aumentar o espaçamento entre linhas;</li>
          <li><strong>Botões e links:</strong> áreas de toque mínimas de 44x44 pixels;</li>
          <li><strong>Formulários:</strong> labels descritivos, mensagens de erro claras e validação acessível;</li>
          <li><strong>Chat em consultas:</strong> alternativa textual para comunicação durante teleconsultas.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-6">3. Conformidade com a Legislação</h2>
        <p>A AloClinica segue as seguintes normativas de acessibilidade:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Lei Brasileira de Inclusão (Lei nº 13.146/2015):</strong> Estatuto da Pessoa com Deficiência;</li>
          <li><strong>Decreto nº 5.296/2004:</strong> regulamenta acessibilidade em ambientes digitais;</li>
          <li><strong>eMAG (Modelo de Acessibilidade em Governo Eletrônico):</strong> referência utilizada como boa prática;</li>
          <li><strong>WCAG 2.1 (W3C):</strong> padrão internacional de acessibilidade web, nível AA.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-6">4. Limitações Conhecidas</h2>
        <p>Reconhecemos que algumas áreas ainda estão em processo de melhoria:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Videochamadas dependem de componentes de terceiros que podem ter limitações de acessibilidade;</li>
          <li>Alguns gráficos de dashboard podem não ser totalmente acessíveis para leitores de tela;</li>
          <li>Conteúdos gerados por médicos (notas, orientações) podem não seguir diretrizes de acessibilidade.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-6">5. Feedback e Suporte</h2>
        <p>Se você encontrar qualquer barreira de acessibilidade na plataforma, ficaremos felizes em ajudar:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>E-mail:</strong> acessibilidade@aloclinica.com.br</li>
          <li><strong>Suporte:</strong> suporte@aloclinica.com.br</li>
        </ul>
        <p>Responderemos a todas as solicitações de acessibilidade em até 5 dias úteis.</p>

        <div className="mt-10 p-4 rounded-xl bg-muted text-xs text-muted-foreground">
          <p>Esta Declaração foi elaborada em conformidade com a Lei Brasileira de Inclusão (Lei nº 13.146/2015), WCAG 2.1 (W3C) e melhores práticas de acessibilidade digital.</p>
        </div>
      </div>
    </div>
  </div>
);

export default Accessibility;
