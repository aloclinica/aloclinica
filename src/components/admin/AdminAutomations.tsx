 import { Link } from "react-router-dom";
 import { useState, useEffect } from "react";
 import { db } from "@/integrations/supabase/untyped";
 import DashboardLayout from "@/components/dashboards/DashboardLayout";
 import { getAdminNav } from "@/components/admin/adminNav";
 import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Zap, MessageCircle, Mail, CreditCard, Activity, CheckCircle2, AlertCircle, Clock, RefreshCw } from "lucide-react";
 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { motion } from "framer-motion";
 
 export default function AdminAutomations() {
   const [logs, setLogs] = useState<any[]>([]);
   const [stats, setStats] = useState({
     whatsapp: { active: false, total_sent: 0 },
     email: { active: true, total_sent: 0 },
     payments: { active: true, total_processed: 0 },
     tasks: { active: true, last_run: null as string | null },
   });
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     fetchData();
   }, []);
 
   const fetchData = async () => {
     setLoading(true);
     try {
       // Fetch recent activity logs related to automations
       const { data: activityLogs } = await db
         .from("activity_logs")
         .select("*")
         .order("created_at", { ascending: false })
         .limit(20);
 
       setLogs(activityLogs || []);
 
       // Fetch counts
       const { count: wppCount } = await db.from("activity_logs").select("id", { count: "exact", head: true }).like("action", "%whatsapp%");
       const { count: emailCount } = await db.from("activity_logs").select("id", { count: "exact", head: true }).like("action", "%email%");
       const { count: payCount } = await db.from("activity_logs").select("id", { count: "exact", head: true }).like("action", "%payment%");
 
       // Check WhatsApp status (simplified logic for now)
       const { data: wppSettings } = await db.from("app_settings").select("value").eq("key", "wpp_instance_name").single();
 
       setStats({
         whatsapp: { active: !!wppSettings, total_sent: wppCount || 0 },
         email: { active: true, total_sent: emailCount || 0 },
         payments: { active: true, total_processed: payCount || 0 },
         tasks: { active: true, last_run: new Date().toISOString() },
       });
     } catch (error) {
       console.error("Error fetching automation data:", error);
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <DashboardLayout title="Automações" nav={getAdminNav("automations")}>
       <div className="space-y-6 pb-24">
         <AdminPageHeader
           icon={Zap}
           eyebrow="Configuração"
           title="Painel de Automações"
           description="Monitore e gerencie todas as automações do sistema em um só lugar."
           accent="from-amber-500 to-orange-600"
         />
 
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <AutomationStatCard
             title="WhatsApp"
             icon={MessageCircle}
             active={stats.whatsapp.active}
             value={stats.whatsapp.total_sent}
             subtitle="Mensagens enviadas"
             color="green"
           />
           <AutomationStatCard
             title="E-mail"
             icon={Mail}
             active={stats.email.active}
             value={stats.email.total_sent}
             subtitle="E-mails processados"
             color="blue"
           />
           <Link to="/dashboard/admin/pagbank?role=admin">
             <AutomationStatCard
               title="Pagamentos"
               icon={CreditCard}
               active={stats.payments.active}
               value={stats.payments.total_processed}
               subtitle="Configurar PagBank"
               color="purple"
             />
           </Link>
           <AutomationStatCard
             title="Tarefas"
             icon={Clock}
             active={stats.tasks.active}
             value="Ativas"
             subtitle={stats.tasks.last_run ? `Última: ${format(new Date(stats.tasks.last_run), "HH:mm")}` : "Sem dados"}
             color="amber"
           />
         </div>
 
         <Card>
           <CardHeader className="flex flex-row items-center justify-between">
             <div>
               <CardTitle>Log de Execução</CardTitle>
               <CardDescription>Atividade recente de todas as automações</CardDescription>
             </div>
             <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
               <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
               Atualizar
             </Button>
           </CardHeader>
           <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Horário</TableHead>
                   <TableHead>Automação</TableHead>
                   <TableHead>Ação</TableHead>
                   <TableHead>Status</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {logs.map((log) => (
                   <TableRow key={log.id}>
                     <TableCell className="text-xs text-muted-foreground">
                       {format(new Date(log.created_at), "dd/MM HH:mm:ss")}
                     </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         {log.action.includes("whatsapp") && <MessageCircle className="w-4 h-4 text-green-500" />}
                         {log.action.includes("email") && <Mail className="w-4 h-4 text-blue-500" />}
                         {log.action.includes("payment") && <CreditCard className="w-4 h-4 text-purple-500" />}
                         {!log.action.includes("whatsapp") && !log.action.includes("email") && !log.action.includes("payment") && <Activity className="w-4 h-4 text-slate-400" />}
                         <span className="capitalize">{log.entity_type || "Sistema"}</span>
                       </div>
                     </TableCell>
                     <TableCell className="max-w-[300px] truncate font-medium">
                       {log.action.replace(/_/g, " ")}
                     </TableCell>
                     <TableCell>
                       <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none">
                         Sucesso
                       </Badge>
                     </TableCell>
                   </TableRow>
                 ))}
                 {logs.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                       Nenhum log encontrado.
                     </TableCell>
                   </TableRow>
                 )}
               </TableBody>
             </Table>
           </CardContent>
         </Card>
       </div>
     </DashboardLayout>
   );
 }
 
 function AutomationStatCard({ title, icon: Icon, active, value, subtitle, color }: any) {
   const colors: any = {
     green: "text-green-600 bg-green-50 dark:bg-green-950/20",
     blue: "text-blue-600 bg-blue-50 dark:bg-blue-950/20",
     purple: "text-purple-600 bg-purple-50 dark:bg-purple-950/20",
     amber: "text-amber-600 bg-amber-50 dark:bg-amber-950/20",
   };
 
   return (
     <Card>
       <CardContent className="pt-6">
         <div className="flex items-start justify-between">
           <div className={`p-2 rounded-lg ${colors[color]}`}>
             <Icon className="w-5 h-5" />
           </div>
           <Badge variant={active ? "default" : "secondary"} className={active ? "bg-green-500" : ""}>
             {active ? "Ativo" : "Inativo"}
           </Badge>
         </div>
         <div className="mt-4">
           <p className="text-2xl font-bold">{value}</p>
           <p className="text-sm font-medium text-foreground/70">{title}</p>
           <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
         </div>
       </CardContent>
     </Card>
   );
 }