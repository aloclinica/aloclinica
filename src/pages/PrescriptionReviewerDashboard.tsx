import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface PrescriptionReview {
  id: string;
  prescription_type: string;
  patient: { full_name: string };
  doctor: { full_name: string; crm: string };
  od_sphere: number | null;
  prescribed_at: string;
  status: string;
  notes: string | null;
}

export default function PrescriptionReviewerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<PrescriptionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;

    const fetchPrescriptions = async () => {
      try {
        const { data } = await db
          .from("ophthalmology_prescriptions")
          .select("id, prescription_type, patient:patient_id(full_name), doctor:doctor_id(full_name, crm), od_sphere, prescribed_at, status:review_status, notes:review_notes")
          .order("prescribed_at", { ascending: false });

        if (data) {
          setPrescriptions(data as any);
        }
      } catch (error) {
        console.error("Erro ao buscar prescrições:", error);
        toast.error("Erro ao carregar prescrições");
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [user]);

  const approvePrescription = async (prescriptionId: string) => {
    setReviewing(prescriptionId);
    try {
      const { error } = await (db as any)
        .from("ophthalmology_prescriptions")
        .update({
          review_status: "approved",
          review_notes: reviewNotes[prescriptionId] || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", prescriptionId);

      if (error) throw error;

      setPrescriptions(prev =>
        prev.map(p => p.id === prescriptionId ? { ...p, status: "approved" } : p)
      );
      toast.success("Prescrição aprovada");
    } catch (error) {
      toast.error("Erro ao aprovar prescrição");
      console.error(error);
    } finally {
      setReviewing(null);
    }
  };

  const rejectPrescription = async (prescriptionId: string) => {
    if (!reviewNotes[prescriptionId]) {
      toast.error("Informe motivo da rejeição");
      return;
    }

    setReviewing(prescriptionId);
    try {
      const { error } = await (db as any)
        .from("ophthalmology_prescriptions")
        .update({
          review_status: "rejected",
          review_notes: reviewNotes[prescriptionId],
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", prescriptionId);

      if (error) throw error;

      setPrescriptions(prev =>
        prev.map(p => p.id === prescriptionId ? { ...p, status: "rejected" } : p)
      );
      toast.success("Prescrição rejeitada");
    } catch (error) {
      toast.error("Erro ao rejeitar prescrição");
      console.error(error);
    } finally {
      setReviewing(null);
    }
  };

  if (!user) return null;

  const pending = prescriptions.filter(p => !p.status || p.status === "pending");
  const approved = prescriptions.filter(p => p.status === "approved");
  const rejected = prescriptions.filter(p => p.status === "rejected");

  const StatCard = ({ icon: Icon, label, value, color, bgColor }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className={`pb-4 bg-gradient-to-r ${bgColor} to-transparent`}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-700">{label}</CardTitle>
            <div className={`p-2 rounded-lg ${bgColor} bg-opacity-20`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  const PrescriptionCard = ({ presc, showActions = false }: { presc: PrescriptionReview; showActions?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <CardTitle className="text-base text-gray-900">{presc.patient?.full_name}</CardTitle>
              <CardDescription className="mt-1">
                Dr(a). {presc.doctor?.full_name} (CRM: {presc.doctor?.crm}) • {presc.prescription_type === "glasses" ? "Óculos" : "Lente"}
              </CardDescription>
            </div>
            <Badge
              variant={
                presc.status === "approved"
                  ? "default"
                  : presc.status === "rejected"
                    ? "destructive"
                    : "secondary"
              }
              className={`whitespace-nowrap ${
                presc.status === "approved" ? "bg-green-100 text-green-700" : ""
              }`}
            >
              {presc.status === "approved" ? "✓ Aprovada" : presc.status === "rejected" ? "✗ Rejeitada" : "⏳ Pendente"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-xs text-blue-600 font-medium mb-1">Tipo</p>
              <p className="font-bold text-blue-900">
                {presc.prescription_type === "glasses" ? "Óculos" : "Lente"}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600 font-medium mb-1">Esfera OD</p>
              <p className="font-bold text-gray-900">
                {presc.od_sphere ? (presc.od_sphere > 0 ? "+" : "") + presc.od_sphere : "—"} D
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600 font-medium mb-1">Data</p>
              <p className="font-bold text-gray-900">
                {new Date(presc.prescribed_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600 font-medium mb-1">ID</p>
              <p className="font-bold text-gray-900 text-xs">{presc.id.slice(0, 8)}</p>
            </div>
          </div>

          {presc.notes && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-700 font-medium mb-1">Notas:</p>
              <p className="text-sm text-yellow-800">{presc.notes}</p>
            </div>
          )}

          {showActions && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Observações ou Motivo da Rejeição
                </label>
                <textarea
                  value={reviewNotes[presc.id] || ""}
                  onChange={(e) => setReviewNotes(prev => ({ ...prev, [presc.id]: e.target.value }))}
                  placeholder="Descreva o motivo da rejeição ou adicione observações..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50 flex items-center justify-center gap-2"
                  onClick={() => rejectPrescription(presc.id)}
                  disabled={reviewing === presc.id}
                >
                  <XCircle className="h-4 w-4" />
                  Rejeitar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                  onClick={() => approvePrescription(presc.id)}
                  disabled={reviewing === presc.id}
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprovar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Revisão de Prescrições</h1>
          <p className="text-gray-600 mt-2">Valide e aprove prescrições oftalmológicas</p>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={AlertCircle}
            label="Pendentes"
            value={pending.length}
            color="text-amber-600"
            bgColor="from-amber-50"
          />
          <StatCard
            icon={CheckCircle}
            label="Aprovadas"
            value={approved.length}
            color="text-green-600"
            bgColor="from-green-50"
          />
          <StatCard
            icon={XCircle}
            label="Rejeitadas"
            value={rejected.length}
            color="text-red-600"
            bgColor="from-red-50"
          />
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Tabs defaultValue="pending" className="w-full">
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending" className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Pendentes</span>
                  <span className="sm:hidden">P</span>
                  <span className="ml-1 text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="approved" className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Aprovadas</span>
                  <span className="sm:hidden">A</span>
                  <span className="ml-1 text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {approved.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="rejected" className="flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Rejeitadas</span>
                  <span className="sm:hidden">R</span>
                  <span className="ml-1 text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {rejected.length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Pending Tab */}
            <TabsContent value="pending" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
                </div>
              ) : pending.length === 0 ? (
                <Card className="border-dashed border-2 bg-amber-50 border-amber-200">
                  <CardContent className="pt-6 text-center">
                    <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-amber-700 font-medium">Nenhuma prescrição pendente</p>
                    <p className="text-sm text-amber-600">Todas as prescrições foram revisadas</p>
                  </CardContent>
                </Card>
              ) : (
                pending.map(presc => (
                  <PrescriptionCard key={presc.id} presc={presc} showActions={true} />
                ))
              )}
            </TabsContent>

            {/* Approved Tab */}
            <TabsContent value="approved" className="space-y-4">
              {approved.length === 0 ? (
                <Card className="border-dashed border-2 bg-green-50 border-green-200">
                  <CardContent className="pt-6 text-center">
                    <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">Nenhuma prescrição aprovada</p>
                    <p className="text-sm text-green-600">As prescrições aprovadas aparecerão aqui</p>
                  </CardContent>
                </Card>
              ) : (
                approved.map(presc => (
                  <PrescriptionCard key={presc.id} presc={presc} showActions={false} />
                ))
              )}
            </TabsContent>

            {/* Rejected Tab */}
            <TabsContent value="rejected" className="space-y-4">
              {rejected.length === 0 ? (
                <Card className="border-dashed border-2 bg-red-50 border-red-200">
                  <CardContent className="pt-6 text-center">
                    <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                    <p className="text-red-700 font-medium">Nenhuma prescrição rejeitada</p>
                    <p className="text-sm text-red-600">As prescrições rejeitadas aparecerão aqui</p>
                  </CardContent>
                </Card>
              ) : (
                rejected.map(presc => (
                  <PrescriptionCard key={presc.id} presc={presc} showActions={false} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
