import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getCartaoNav } from "./cartaoNav";
import PatientSupportChat from "@/components/patient/PatientSupportChat";

const SuporteCartao = () => {
  const nav = getCartaoNav("support");
  return (
    <DashboardLayout title="Suporte" nav={nav} role="cartao_beneficios">
      <div className="max-w-5xl mx-auto pb-20">
        <PatientSupportChat />
      </div>
    </DashboardLayout>
  );
};

export default SuporteCartao;