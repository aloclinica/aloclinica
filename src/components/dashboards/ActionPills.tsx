import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface PillAction {
  label: string;
  icon: ReactNode;
  iconBg: string;
  path: string;
  badge?: number;
}

interface ActionPillsProps {
  actions: PillAction[];
  title?: string;
}

export function ActionPills({ actions, title }: ActionPillsProps) {
  const navigate = useNavigate();
  return (
    <div>
      {title && <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">{title}</p>}
      <div className="flex flex-wrap gap-2.5 pb-1.5 md:pb-0 -mx-1 px-1">
        {actions.map((a, i) => (
          <motion.button
            key={a.label}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 280, damping: 22 }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ y: -2, scale: 1.03 }}
            onClick={() => navigate(a.path)}
            className="app-card group relative flex shrink-0 items-center gap-2.5 rounded-[24px] px-3.5 py-3 active:scale-95"
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[12px] text-[15px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
              a.iconBg
            )}>
              {a.icon}
            </div>
            <span className="text-[11.5px] font-semibold text-foreground whitespace-nowrap">{a.label}</span>
            {(a.badge ?? 0) > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-destructive px-1 text-[8px] font-black text-white ring-2 ring-background shadow-sm"
              >
                {a.badge! > 9 ? "9+" : a.badge}
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
