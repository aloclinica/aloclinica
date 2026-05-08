 import { useState, useEffect } from "react";
 import { db } from "@/integrations/supabase/untyped";
 import DashboardLayout from "@/components/dashboards/DashboardLayout";
 import { getAdminNav } from "@/components/admin/adminNav";
 import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 import { CreditCard, Save, ShieldCheck, AlertCircle } from "lucide-react";
 import { toast } from "sonner";
 
 export default function AdminPagBank() {
   const [settings, setSettings] = useState({
     token: "",
     env: "sandbox",
     enabled: false,
   });
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
 
   useEffect(() => {
     loadSettings();
   }, []);
 
   const loadSettings = async () => {
     try {
       const { data } = await db.from("app_settings").select("*").like("key", "pagbank_%");
       if (data) {
         const s = { ...settings };
         data.forEach(item => {
           if (item.key === "pagbank_token") s.token = item.value;
           if (item.key === "pagbank_env") s.env = item.value;
           if (item.key === "pagbank_enabled") s.enabled = item.value === "true";
         });
         setSettings(s);
       }
     } catch (err) {
       console.error(err);
     } finally {
       setLoading(false);
     }
   };
 
   const saveSettings = async () => {
     setSaving(true);
     try {
       const updates = [
         { key: "pagbank_token", value: settings.token },
         { key: "pagbank_env", value: settings.env },
         { key: "pagbank_enabled", value: String(settings.enabled) },
       ];
 
       for (const update of updates) {
         await db.from("app_settings").upsert({
           key: update.key,
           value: update.value,
           updated_at: new Date().toISOString()
         });
       }
       toast.success("Configurações do PagBank salvas!");
     } catch (err) {
       toast.error("Erro ao salvar configurações");
     } finally {
       setSaving(false);
     }
   };
 
   return (
     <DashboardLayout title="PagBank" nav={getAdminNav("pagbank")}>
       <div className="space-y-6 pb-24">
         <AdminPageHeader
           icon={CreditCard}
           eyebrow="Pagamentos"
           title="PagBank Integration"
           description="Configure suas credenciais do PagBank para processar pagamentos."
           accent="from-blue-600 to-blue-800"
         />
 
         <div className="grid gap-6">
           <Card>
             <CardHeader>
               <CardTitle>Credenciais da API</CardTitle>
               <CardDescription>Obtenha seu token no painel do PagBank.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                 <div className="space-y-0.5">
                   <Label>Ativar PagBank</Label>
                   <p className="text-xs text-muted-foreground">Usar PagBank como provedor principal de pagamentos.</p>
                 </div>
                 <Switch
                   checked={settings.enabled}
                   onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
                 />
               </div>
 
               <div className="space-y-2">
                 <Label>Token de Acesso</Label>
                 <Input
                   type="password"
                   value={settings.token}
                   onChange={(e) => setSettings({ ...settings, token: e.target.value })}
                   placeholder="Bearer Token..."
                 />
               </div>
 
               <div className="space-y-2">
                 <Label>Ambiente</Label>
                 <div className="flex gap-4">
                   <Button
                     variant={settings.env === "sandbox" ? "default" : "outline"}
                     onClick={() => setSettings({ ...settings, env: "sandbox" })}
                   >
                     Sandbox (Teste)
                   </Button>
                   <Button
                     variant={settings.env === "production" ? "default" : "outline"}
                     onClick={() => setSettings({ ...settings, env: "production" })}
                   >
                     Produção
                   </Button>
                 </div>
               </div>
 
               <Button onClick={saveSettings} disabled={saving} className="w-full">
                 <Save className="w-4 h-4 mr-2" />
                 {saving ? "Salvando..." : "Salvar Configurações"}
               </Button>
             </CardContent>
           </Card>
 
           <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30">
             <CardContent className="pt-6">
               <div className="flex gap-3">
                 <ShieldCheck className="w-5 h-5 text-blue-600" />
                 <div>
                   <p className="font-semibold text-blue-900 dark:text-blue-100">Segurança de Dados</p>
                   <p className="text-sm text-blue-700 dark:text-blue-300">
                     Suas chaves são armazenadas de forma segura e usadas apenas para comunicação direta com a API do PagBank através de nossas Edge Functions protegidas.
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
       </div>
     </DashboardLayout>
   );
 }