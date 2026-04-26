import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getCartaoNav } from "./cartaoNav";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Storefront, Flask, Eyeglasses, Lightning, MapPin, MagnifyingGlass, Phone } from "@phosphor-icons/react";

interface Partner {
  id: string; name: string; category: string; description: string | null;
  discount_percent: number; discount_description: string | null;
  city: string | null; state: string | null; phone: string | null;
  address: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  farmacia: <Storefront size={18} weight="fill" />,
  laboratorio: <Flask size={18} weight="fill" />,
  otica: <Eyeglasses size={18} weight="fill" />,
  academia: <Lightning size={18} weight="fill" />,
};

const CATEGORY_CHIPS = [
  { id: "all", label: "Todas" },
  { id: "farmacia", label: "Farmácia" },
  { id: "laboratorio", label: "Laboratório" },
  { id: "otica", label: "Ótica" },
  { id: "academia", label: "Academia" },
] as const;

const RedeCredenciada = () => {
  const nav = getCartaoNav("rede");
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [text, setText] = useState("");
  const [cat, setCat] = useState("all");

  useEffect(() => {
    (async () => {
      const { data } = await db
        .from("pingo_card_partners")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      setPartners((data ?? []) as Partner[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      const t = text.toLowerCase();
      const matchT = !t || `${p.name} ${p.city ?? ""} ${p.address ?? ""}`.toLowerCase().includes(t);
      const matchC = cat === "all" || p.category === cat;
      return matchT && matchC;
    });
  }, [partners, text, cat]);

  return (
    <DashboardLayout title="Rede Credenciada" nav={nav} role="cartao_beneficios">
      <div className="space-y-5 max-w-6xl mx-auto pb-20">
        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" weight="bold" />
            <Input placeholder="Buscar por nome, cidade ou endereço…" className="pl-9 rounded-xl h-11" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {CATEGORY_CHIPS.map((c) => {
              const active = cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-10 text-center text-muted-foreground">
              Nenhum parceiro encontrado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <Card key={p.id} className="rounded-2xl hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      {categoryIcons[p.category] ?? <Storefront size={20} weight="fill" />}
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 font-bold">-{p.discount_percent}%</Badge>
                  </div>
                  <h3 className="font-bold mb-1">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {p.discount_description ?? p.description}
                  </p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {p.city && (
                      <p className="flex items-center gap-1.5">
                        <MapPin size={12} weight="fill" /> {p.city}{p.state ? `, ${p.state}` : ""}
                      </p>
                    )}
                    {p.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone size={12} weight="fill" /> {p.phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RedeCredenciada;