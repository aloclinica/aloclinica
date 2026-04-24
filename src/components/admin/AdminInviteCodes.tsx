import { useState, useEffect } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "@/components/admin/adminNav";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
// ... keep existing code
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Copy, Plus, Check, Key } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { InviteCode } from "@/types/domain";

const AdminInviteCodes = () => {
  const { user } = useAuth();
  
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { fetchCodes(); }, []);

  const fetchCodes = async () => {
    const { data } = await db
      .from("doctor_invite_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setCodes(data ?? []);
    setLoading(false);
  };

  const generateCode = async () => {
    if (!user) return;
    setGenerating(true);
    const code = `MED-${randomBlock()}-${randomBlock()}`;
    const { error } = await db.from("doctor_invite_codes").insert({
      code,
      created_by: user.id,
    });
    setGenerating(false);
    if (error) {
      toast.error("Erro ao gerar código", { description: error.message });
      return;
    }
    toast.success("Código gerado!", { description: code });
    fetchCodes();
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Copiado!", { description: code });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("invite-codes")}>
      <div className="w-full mx-auto max-w-4xl space-y-5 pb-24 md:pb-6">
        <AdminPageHeader
          icon={Key}
          eyebrow="Conteúdo"
          title="Códigos de Convite"
          description="Gere códigos para cadastro de novos médicos na plataforma."
          accent="from-amber-500 to-orange-600"
          actions={
            <Button onClick={generateCode} disabled={generating} size="sm" className="bg-gradient-to-r from-secondary to-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-1.5" />
              {generating ? "Gerando..." : "Gerar Código"}
            </Button>
          }
        />

        <Card className="border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto -mx-0.5 rounded-xl">

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum código gerado ainda.
                    </TableCell>
                  </TableRow>
                )}
                {loading ? (

                  Array.from({ length: 5 }).map((_, i) => (

                    <tr key={i} className="border-b border-border/30">
                            <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
      <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
      <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
      <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
      <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>

                    </tr>
                  ))

                ) : codes.map(c => (
                  <TableRow key={c.id}>
                    <TableCell data-label="Código" className="font-mono font-bold text-foreground tracking-wider">{c.code}</TableCell>
                    <TableCell data-label="Status">
                      {c.is_used ? (
                        <Badge variant="outline">Utilizado</Badge>
                      ) : (
                        <Badge variant="default" className="bg-secondary text-secondary-foreground">Disponível</Badge>
                      )}
                    </TableCell>
                    <TableCell data-label="Criado" className="text-muted-foreground text-sm">
                      {format(new Date(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell data-label="">
                      {!c.is_used && (
                        <Button size="sm" variant="ghost" onClick={() => copyCode(c.code, c.id)}>
                          {copiedId === c.id ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

function randomBlock() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export default AdminInviteCodes;
