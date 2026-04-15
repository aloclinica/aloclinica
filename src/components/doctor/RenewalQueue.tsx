import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "./doctorNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Eye, CheckCircle2, XCircle, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notifyRenewalApproved, notifyRenewalRejected } from "@/lib/notifications-queue";

import type { Json } from "@/integrations/supabase/types";

interface RenewalItem {
  id: string;
  patient_id: string;
  status: string;
  created_at: string;
  assigned_doctor_id: string | null;
  original_prescription_url: string | null;
  health_questionnaire: Json;
  rejection_reason: string | null;
}

const RenewalQueue = () => {
  const { user } = useAuth();
  const [renewals, setRenewals] = useState<RenewalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  const [selectedRenewal, setSelectedRenewal] = useState<RenewalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) { fetchDoctorProfile(); fetchRenewals(); }
  }, [user]);

  const fetchDoctorProfile = async () => {
    if (!user) return;
    const { data } = await db.from("doctor_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (data) setDoctorProfileId(data.id);
  };

  const fetchRenewals = async () => {
    const { data } = await supabase
      .from("prescription_renewals")
      .select("*")
      .in("status", ["pending", "in_review"])
      .order("created_at", { ascending: true });
    setRenewals(data ?? []);
    setLoading(false);
  };

  const handleClaim = async (renewal: RenewalItem) => {
    if (!doctorProfileId) return;
    await db.from("prescription_renewals").update({
      status: "in_review",
      assigned_doctor_id: doctorProfileId,
    }).eq("id", renewal.id);
    toast.success("Renovação assumida!");
    fetchRenewals();
  };

  const getDoctorName = async () => {
    if (!user) return "Médico";
    const { data } = await db.from("profiles").select("first_name, last_name").eq("user_id", user.id).maybeSingle();
    return data ? `Dr(a). ${data.first_name} ${data.last_name}` : "Médico";
  };

  const handleApprove = async () => {
    if (!selectedRenewal || !doctorProfileId) return;
    setProcessing(true);
    await db.from("prescription_renewals").update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
    }).eq("id", selectedRenewal.id);
    
    // Notify patient
    const docName = await getDoctorName();
    notifyRenewalApproved(selectedRenewal.patient_id, docName);
    
    toast.success("Renovação aprovada!");
    setSelectedRenewal(null);
    setProcessing(false);
    fetchRenewals();
  };

  const handleReject = async () => {
    if (!selectedRenewal) return;
    setProcessing(true);
    const reason = rejectionReason || "Não aprovada pelo médico";
    await db.from("prescription_renewals").update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    }).eq("id", selectedRenewal.id);
    
    // Notify patient
    const docName = await getDoctorName();
    notifyRenewalRejected(selectedRenewal.patient_id, docName, reason);
    
    toast.success("Renovação rejeitada.");
    setSelectedRenewal(null);
    setRejectionReason("");
    setProcessing(false);
    fetchRenewals();
  };

  const viewPrescription = async (url: string) => {
    const { data } = await db.storage.from("patient-documents").createSignedUrl(url, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("renewal-queue")}>
      <div className="w-full mx-auto max-w-4xl pb-24 md:pb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">💊 Renovações de Receita</h1>
        <p className="text-muted-foreground text-sm mb-6">Analise e aprove solicitações de renovação</p>

        {loading ? <div className="shimmer-v2 h-20 rounded-2xl"/> : renewals.length === 0 ? (
          <Card><CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-foreground mb-1">Nenhuma renovação pendente</h3>
          </CardContent></Card>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto -mx-0.5 rounded-xl">

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renewals.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "pending" ? "outline" : "default"}>
                        {r.status === "pending" ? "Pendente" : "Em análise"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.original_prescription_url && (
                        <Button size="sm" variant="ghost" onClick={() => viewPrescription(r.original_prescription_url!)}>
                          <Eye className="w-3 h-3 mr-1" /> Ver
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {r.status === "pending" ? (
                        <Button size="sm" onClick={() => handleClaim(r)}>
                          <UserCheck className="w-3 h-3 mr-1" /> Assumir
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => setSelectedRenewal(r)}>
                          <FileText className="w-3 h-3 mr-1" /> Analisar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        )}

        {/* Review dialog */}
        <Dialog open={!!selectedRenewal} onOpenChange={() => setSelectedRenewal(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Analisar Renovação</DialogTitle></DialogHeader>
            {selectedRenewal && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                  <h4 className="font-semibold">Questionário de Saúde</h4>
                  {Object.entries(selectedRenewal.health_questionnaire || {}).map(([k, v]) => (
                    <div key={k}><span className="font-medium capitalize">{k.replace(/_/g, " ")}:</span> {String(v) || "N/A"}</div>
                  ))}
                </div>
                {selectedRenewal.original_prescription_url && (
                  <Button variant="outline" className="w-full" onClick={() => viewPrescription(selectedRenewal.original_prescription_url!)}>
                    <Eye className="w-4 h-4 mr-2" /> Ver Receita Original
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove} disabled={processing}>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={handleReject} disabled={processing}>
                    <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                  </Button>
                </div>
                <Textarea placeholder="Motivo da rejeição (opcional)" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default RenewalQueue;
