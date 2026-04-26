import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getCartaoNav } from "./cartaoNav";
import LGPDCenter from "@/components/patient/LGPDCenter";

const LgpdCartao = () => {
  const nav = getCartaoNav("lgpd");
  return (
    <DashboardLayout title="Privacidade" nav={nav} role="cartao_beneficios">
      <div className="max-w-5xl mx-auto pb-20">
        <LGPDCenter />
      </div>
    </DashboardLayout>
  );
};

export default LgpdCartao;