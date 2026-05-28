import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const FaqChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Olá! Sou o assistente Aloclinica 🐧. Como posso ajudar?" },
  ]);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput(""); setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("faq-chat-bot", { body: { question: q } });
      if (error) throw error;
      setMessages((m) => [...m, { role: "assistant", content: data?.answer || "Sem resposta." }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: "Erro ao consultar. Tente novamente." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50" aria-label="Abrir chat de ajuda">
          <MessageCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b"><SheetTitle>Ajuda Aloclinica</SheetTitle></SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg p-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted prose prose-sm dark:prose-invert"}`}>
                {m.role === "assistant" ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
              </div>
            </div>
          ))}
          {busy && <div className="flex justify-start"><div className="bg-muted rounded-lg p-2.5"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
        </div>
        <div className="p-3 border-t flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Digite sua dúvida..." disabled={busy} />
          <Button onClick={send} disabled={busy || !input.trim()} size="icon" aria-label="Enviar pergunta"><Send className="h-4 w-4" /></Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FaqChatWidget;