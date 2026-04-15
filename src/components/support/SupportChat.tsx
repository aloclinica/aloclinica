import { useState, useRef, useEffect } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { SUPABASE_FUNCTIONS_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, Headset } from "lucide-react";

type Message = { role: "user" | "assistant" | "support"; content: string };

const WELCOME_MSG = "Olá! 🐧 Sou o Pingo, assistente virtual da Alô Médico. Como posso ajudar a equipe de suporte hoje?";
const CHAT_URL = `${SUPABASE_FUNCTIONS_URL}/pingo-chat`;

const SupportChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME_MSG },
  ]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Load chat history from DB
  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      const { data } = await supabase
        .from("support_chat_messages")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data && data.length > 0) {
        setMessages(data.map(m => ({ role: m.role as "user" | "assistant" | "support", content: m.content })));
      }
      setHistoryLoaded(true);
    };
    loadHistory();
  }, [user]);

  // Realtime: listen for support replies + typing indicators
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("support-chat-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_chat_messages", filter: `user_id=eq.${user.id}` }, (payload) => {
        const newMsg = payload.new as { id: string; sender_id: string; content: string; created_at: string; role?: string };
        if (newMsg.role === "support" || newMsg.role === "assistant") {
          setMessages(prev => [...prev, { role: newMsg.role as "support" | "assistant", content: newMsg.content || "" }]);
          setOtherTyping(false);
        }
      })
      .subscribe();

    // Typing broadcast channel
    const typingChannel = supabase
      .channel(`support-typing-${user.id}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.sender_id !== user.id) {
          setOtherTyping(true);
          setTimeout(() => setOtherTyping(false), 3000);
        }
      })
      .subscribe();
    typingChannelRef.current = typingChannel;

    return () => {
      db.removeChannel(channel);
      db.removeChannel(typingChannel);
    };
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const persistMessage = async (role: "user" | "assistant", content: string) => {
    if (!user) return;
    await db.from("support_chat_messages").insert({
      user_id: user.id,
      role,
      content,
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    // Persist user message
    persistMessage("user", userMsg.content);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          user_id: user?.id,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao conectar com o assistente");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("Stream não disponível");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > allMessages.length) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantContent) {
        persistMessage("assistant", assistantContent);
      } else {
        const fallback = "Desculpe, não consegui processar sua mensagem. Tente novamente.";
        setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
        persistMessage("assistant", fallback);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Erro ao conectar com o assistente. Tente novamente.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ ${errMsg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border h-[60vh] min-h-[400px] max-h-[700px] flex flex-col">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          Chat de Suporte — Pingo
          <Badge variant="secondary" className="text-[10px]">IA</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                {msg.role === "support" && (
                  <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-1">
                    <Headset className="w-4 h-4 text-success" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : msg.role === "support"
                      ? "bg-success/10 text-foreground border border-success/20"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.role === "support" && (
                    <span className="text-[10px] font-medium text-success block mb-0.5">Equipe de Suporte</span>
                  )}
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-secondary" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {otherTyping && !isLoading && (
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center">
                  <Headset className="w-4 h-4 text-success" />
                </div>
                <span className="text-xs text-muted-foreground animate-pulse">digitando...</span>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-border flex gap-2">
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Broadcast typing
              if (!isTyping && typingChannelRef.current && user) {
                setIsTyping(true);
                typingChannelRef.current.send({ type: "broadcast", event: "typing", payload: { sender_id: user.id } });
              }
              clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
            }}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button size="icon" onClick={sendMessage} disabled={isLoading || !input.trim()} aria-label="Enviar">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportChat;
