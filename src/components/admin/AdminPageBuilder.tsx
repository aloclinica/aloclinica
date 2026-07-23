/**
 * AdminPageBuilder — editor de páginas visuais completo.
 * Permite criar e editar seções complexas e layout da página via JSON.
 */
import { useState } from "react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "./adminNav";
import { AdminPageHeader } from "./AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Save, Plus, Trash2, Eye } from "lucide-react";
import { JsonField } from "./site-config/shared";
import { toast } from "sonner";

export default function AdminPageBuilder() {
  const [pageConfig, setPageConfig] = useState(JSON.stringify({
    sections: [
      { id: "hero", type: "hero", props: { title: "Bem-vindo" } }
    ]
  }, null, 2));

  const save = () => {
    try {
      JSON.parse(pageConfig);
      // NB: esta tela ainda não persiste no site — não fingir "salvo com sucesso".
      toast.info("JSON válido. Atenção: este editor ainda não publica no site — use o Studio para páginas reais.");
    } catch (e) {
      toast.error("JSON inválido");
    }
  };

  return (
    <DashboardLayout title="Editor de Páginas" nav={getAdminNav("pages")}>
      <div className="space-y-6 pb-24 md:pb-8">
        <AdminPageHeader
          icon={LayoutGrid}
          eyebrow="CMS"
          title="Editor de Páginas"
          description="Crie e ajuste a estrutura de páginas complexas usando JSON de configuração."
          accent="from-indigo-500 to-purple-600"
          actions={
            <Button size="sm" onClick={save} className="gap-2">
              <Save className="w-4 h-4" /> Salvar Layout
            </Button>
          }
        />

        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          🚧 <strong>Em desenvolvimento.</strong> Esta tela ainda não salva no site. Para criar e publicar páginas de verdade (com rascunho e publicação), use o <strong>Studio</strong>.
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="h-[600px] flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              <h2 className="text-sm font-bold mb-3">Estrutura (JSON)</h2>
              <div className="flex-1">
                <JsonField 
                  value={pageConfig} 
                  onChange={setPageConfig} 
                  placeholder='{"sections": []}' 
                  minH="500px" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="h-[600px] flex flex-col bg-muted/20">
            <CardContent className="p-4 flex flex-col h-full items-center justify-center">
              <Eye className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground">Preview dinâmico em desenvolvimento</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
