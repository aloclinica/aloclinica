import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getCartaoNav } from "./cartaoNav";
import DependentsManager from "@/components/patient/DependentsManager";

/**
 * Reaproveita o gerenciador de dependentes do paciente (mesmo banco)
 * dentro do shell visual do painel Cartão Benefícios.
 */
const DependentesCartao = () => {
  const nav = getCartaoNav("dependentes");
  return (
    <DashboardLayout title="Dependentes" nav={nav} role="cartao_beneficios">
      <div className="max-w-5xl mx-auto pb-20">
        <DependentsManager />
      </div>
    </DashboardLayout>
  );
};

export default DependentesCartao;