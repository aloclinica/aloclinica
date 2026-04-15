import { logError } from "@/lib/logger";
import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, User, Headset, Search, ArrowLeft, Loader2, Inbox, Bell, CheckCircle, Clock, XCircle, Volume2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Ticket {
  id: string;
  patient_id: string;
  assigned_to: string | null;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  patient_cpf?: string;
  patient_phone?: string;
  unread_count: number;
  last_message?: string;
  last_message_at?: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  bot: { label: "Bot", color: "bg-secondary/10 text-secondary border-secondary/20", icon: Clock },
  waiting_human: { label: "Aguardando", color: "bg-warning/10 text-warning border-warning/20", icon: Bell },
  in_service: { label: "Em atendimento", color: "bg-success/10 text-success border-success/20", icon: Headset },
  closed: { label: "Encerrado", color: "bg-muted text-muted-foreground border-border", icon: CheckCircle },
};

const SupportInbox = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("waiting_human");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Create audio for notification
  useEffect(() => {
    // Use a simple beep sound via Web Audio API
    audioRef.current = null; // We'll use Web Audio API instead
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1000;
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.15);
      }, 250);
    } catch (e) {
      logError("SupportInbox audio unavailable", e);
    }
  }, [soundEnabled]);

  const fetchTickets = useCallback(async () => {
    const { data: ticketsData, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error || !ticketsData) {
      logError("SupportInbox fetch tickets error", error);
      setLoading(false);
      return;
    }

    // Get patient profiles
    const patientIds = [...new Set(ticketsData.map(t => t.patient_id))];
    const { data: profiles } = patientIds.length > 0
      ? await db.from("profiles").select("user_id, first_name, last_name, cpf, phone").in("user_id", patientIds)
      : { data: [] };

    const profileMap = new Map<string, any>();
    (profiles ?? []).forEach(p => profileMap.set(p.user_id, p));

    // Get unread counts and last messages
    const ticketIds = ticketsData.map(t => t.id);
    const { data: allMessages } = ticketIds.length > 0
      ? await db.from("support_messages").select("ticket_id, content, created_at, is_read, sender_role")
          .in("ticket_id", ticketIds).order("created_at", { ascending: false })
      : { data: [] };

    const unreadMap = new Map<string, number>();
    const lastMsgMap = new Map<string, { content: string; created_at: string }>();
    (allMessages ?? []).forEach(m => {
      if (!lastMsgMap.has(m.ticket_id)) {
        lastMsgMap.set(m.ticket_id, { content: m.content, created_at: m.created_at });
      }
      if (!m.is_read && m.sender_role === "patient") {
        unreadMap.set(m.ticket_id, (unreadMap.get(m.ticket_id) ?? 0) + 1);
      }
    });

    const enrichedTickets: Ticket[] = ticketsData.map(t => {
      const profile = profileMap.get(t.patient_id);
      const lastMsg = lastMsgMap.get(t.id);
      return {
        ...t,
        patient_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : "Paciente",
        patient_cpf: profile?.cpf ?? null,
        patient_phone: profile?.phone ?? null,
        unread_count: unreadMap.get(t.id) ?? 0,
        last_message: lastMsg?.content,
        last_message_at: lastMsg?.created_at,
      };
    });

    setTickets(enrichedTickets);
    setLoading(false);
  }, []);

  const fetchMessages = useCallback(async (ticketId: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);

    // Mark patient messages as read
    if (user) {
      await db.from("support_messages")
        .update({ is_read: true })
        .eq("ticket_id", ticketId)
        .eq("sender_role", "patient")
        .eq("is_read", false);
    }
  }, [user]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Realtime: listen for ticket changes and new messages
  useEffect(() => {
    const channel = supabase
      .channel("support-tickets-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, (payload) => {
        fetchTickets();
        if (payload.eventType === "UPDATE" && (payload.new as { status?: string }).status === "waiting_human") {
          playNotificationSound();
          toast.info("🔔 Novo atendimento aguardando!", { duration: 5000 });
        }
        if (payload.eventType === "INSERT") {
          playNotificationSound();
          toast.info("🆕 Novo ticket de suporte!", { duration: 5000 });
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, (payload) => {
        const newMsg = payload.new as TicketMessage;
        if (selectedTicket && newMsg.ticket_id === selectedTicket.id) {
          setMessages(prev => [...prev, newMsg]);
          if (newMsg.sender_role === "patient") {
            playNotificationSound();
          }
        }
        fetchTickets();
      })
      .subscribe();
    return () => { db.removeChannel(channel); };
  }, [selectedTicket, fetchTickets, playNotificationSound]);

  useEffect((): (() => void) | void => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      // Setup typing channel for this ticket's patient
      const typingChannel = supabase
        .channel(`support-typing-${selectedTicket.patient_id}`)
        .on("broadcast", { event: "typing" }, (payload) => {
          if (payload.payload.sender_id !== user?.id) {
            setOtherTyping(true);
            setTimeout(() => setOtherTyping(false), 3000);
          }
        })
        .subscribe();
      typingChannelRef.current = typingChannel;
      return () => {
        db.removeChannel(typingChannel);
        typingChannelRef.current = null;
        setOtherTyping(false);
      };
    }
  }, [selectedTicket, fetchMessages, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const sendReply = async () => {
    if (!input.trim() || !selectedTicket || !user || sending) return;
    setSending(true);

    // Insert message
    const { error } = await db.from("support_messages").insert({
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      sender_role: "support",
      content: input.trim(),
    });

    if (error) {
      toast.error("Erro ao enviar resposta");
      setSending(false);
      return;
    }

    // Update ticket status to in_service
    if (selectedTicket.status === "waiting_human") {
      await db.from("support_tickets")
        .update({ status: "in_service", assigned_to: user.id })
        .eq("id", selectedTicket.id);
      setSelectedTicket(prev => prev ? { ...prev, status: "in_service", assigned_to: user.id } : null);
    }

    setInput("");
    setSending(false);
  };

  const closeTicket = async () => {
    if (!selectedTicket) return;
    await db.from("support_tickets")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", selectedTicket.id);
    setSelectedTicket(null);
    toast.success("Ticket encerrado!");
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = (t.patient_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.subject ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const waitingCount = tickets.filter(t => t.status === "waiting_human").length;
  const inServiceCount = tickets.filter(t => t.status === "in_service").length;

  if (loading) {
    return (
      <Card className="border-border h-[60vh] min-h-[400px] max-h-[700px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  // Conversation detail view
  if (selectedTicket) {
    const statusConf = STATUS_CONFIG[selectedTicket.status] ?? STATUS_CONFIG.bot;
    return (
      <Card className="border-border h-[60vh] min-h-[400px] max-h-[700px] flex flex-col">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" aria-label="Ação" onClick={() =>  setSelectedTicket(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm font-semibold truncate">{selectedTicket.patient_name}</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  {selectedTicket.patient_cpf && (
                    <span className="text-[10px] text-muted-foreground">CPF: {selectedTicket.patient_cpf}</span>
                  )}
                  {selectedTicket.patient_phone && (
                    <span className="text-[10px] text-muted-foreground">Tel: {selectedTicket.patient_phone}</span>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={`text-[10px] ${statusConf.color}`}>{statusConf.label}</Badge>
              {otherTyping && (
                <span className="text-[10px] text-primary font-medium animate-pulse">digitando...</span>
              )}
              {selectedTicket.status !== "closed" && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={closeTicket}>
                  <XCircle className="w-3 h-3" /> Encerrar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.sender_role === "patient" ? "justify-start" : "justify-end"}`}>
                  {msg.sender_role === "patient" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="max-w-[80%]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                        msg.sender_role === "patient" ? "border-primary/30 text-primary" : "border-success/30 text-success"
                      }`}>
                        {msg.sender_role === "patient" ? "Paciente" : "Suporte"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      msg.sender_role === "patient" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                  {msg.sender_role === "support" && (
                    <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-1">
                      <Headset className="w-4 h-4 text-success" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          {selectedTicket.status !== "closed" && (
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (!isTyping && typingChannelRef.current && user) {
                    setIsTyping(true);
                    typingChannelRef.current.send({ type: "broadcast", event: "typing", payload: { sender_id: user.id } });
                  }
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
                }}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                placeholder="Responder ao paciente..."
                disabled={sending}
                className="flex-1"
              />
              <Button size="icon" onClick={sendReply} disabled={sending || !input.trim()} aria-label="Ação">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Ticket list view
  return (
    <Card className="border-border h-[60vh] min-h-[400px] max-h-[700px] flex flex-col">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            Tickets de Suporte
            {waitingCount > 0 && (
              <Badge variant="destructive" className="text-[10px] animate-pulse">
                {waitingCount} aguardando
              </Badge>
            )}
          </CardTitle>
          <Button variant={soundEnabled ? "default" : "outline"}
            size="icon"
            className="h-7 w-7"
            aria-label="Ação" onClick={() =>  setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Som ativado" : "Som desativado"}
          >
            <Volume2 className={`w-3.5 h-3.5 ${soundEnabled ? "" : "opacity-50"}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Status filter tabs */}
        <div className="p-3 border-b border-border space-y-2">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="w-full h-8">
              <TabsTrigger value="waiting_human" className="flex-1 text-[11px] h-6 gap-1">
                <Bell className="w-3 h-3" /> Aguardando {waitingCount > 0 && `(${waitingCount})`}
              </TabsTrigger>
              <TabsTrigger value="in_service" className="flex-1 text-[11px] h-6 gap-1">
                <Headset className="w-3 h-3" /> Atendendo {inServiceCount > 0 && `(${inServiceCount})`}
              </TabsTrigger>
              <TabsTrigger value="all" className="flex-1 text-[11px] h-6">Todos</TabsTrigger>
              <TabsTrigger value="closed" className="flex-1 text-[11px] h-6">Fechados</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por paciente..." className="pl-10 h-8 text-sm" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">Nenhum ticket encontrado</p>
              <p className="text-xs mt-1">Tickets aparecerão aqui quando pacientes solicitarem atendimento humano.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTickets.map((ticket) => {
                const statusConf = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.bot;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors text-left ${
                      ticket.status === "waiting_human" ? "bg-warning/5" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        ticket.status === "waiting_human" ? "bg-warning/10" : "bg-primary/10"
                      }`}>
                        <User className={`w-5 h-5 ${ticket.status === "waiting_human" ? "text-warning" : "text-primary"}`} />
                      </div>
                      {ticket.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                          {ticket.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${ticket.unread_count > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                          {ticket.patient_name}
                        </p>
                        <Badge variant="outline" className={`text-[9px] shrink-0 ${statusConf.color}`}>
                          {statusConf.label}
                        </Badge>
                      </div>
                      {ticket.patient_cpf && (
                        <p className="text-[10px] text-muted-foreground/70">CPF: {ticket.patient_cpf}</p>
                      )}
                      <p className={`text-xs truncate mt-0.5 ${ticket.unread_count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                        {ticket.last_message ?? ticket.subject}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(ticket.last_message_at ?? ticket.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SupportInbox;
