import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "@/integrations/supabase/untyped";
import RateConsultation from "@/components/patient/RateConsultation";
import { Loader2 } from "lucide-react";

const RateConsultationPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appointmentId) return;
    const fetch = async () => {
      const { data } = await db
        .from("appointments")
        .select("doctor_id")
        .eq("id", appointmentId)
        .single();
      if (data) setDoctorId(data.doctor_id);
      setLoading(false);
    };
    fetch();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doctorId || !appointmentId) {
    navigate("/dashboard/appointments");
    return null;
  }

  return (
    <RateConsultation
      appointmentId={appointmentId}
      doctorId={doctorId}
      onClose={() => navigate("/dashboard/appointments")}
    />
  );
};

export default RateConsultationPage;
