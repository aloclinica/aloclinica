import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Bug, Terminal, UserShield } from "lucide-react";
import { toast } from "sonner";

export const DevModeToggle = () => {
  const [isDev, setIsDev] = useState(false);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    const dev = localStorage.getItem("aloclinica_dev_mode") === "true";
    setIsDev(dev);
  }, []);

  const toggleDevMode = () => {
    const next = !isDev;
    localStorage.setItem("aloclinica_dev_mode", String(next));
    setIsDev(next);
    toast.success(next ? "Modo Dev Ativado 🛠️" : "Modo Dev Desativado 🔒", {
      description: next ? "Ferramentas de teste habilitadas." : "Interface de produção restaurada."
    });
    // Force reload to update IS_DEV constant if needed, 
    // though reactive components will update if we use a hook.
    setTimeout(() => window.location.reload(), 800);
  };

  // Show if already dev or on lovable or after 7 clicks on logo (standard easter egg)
  const isLovable = typeof window !== "undefined" && window.location.hostname.includes("lovable.app");
  
  if (!isDev && !isLovable) return null;

  return (
    <div className="px-3 py-2">
      <Button 
        variant={isDev ? "destructive" : "outline"} 
        size="sm" 
        onClick={toggleDevMode}
        className="w-full h-8 rounded-lg text-[10px] gap-2 font-bold"
      >
        {isDev ? <Bug className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
        {isDev ? "Desativar Modo Dev" : "Ativar Modo Dev"}
      </Button>
    </div>
  );
};