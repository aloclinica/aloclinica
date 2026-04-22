import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  mascot?: boolean;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; variant?: "default" | "outline" };
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { py: "py-8", icon: "w-10 h-10", iconInner: "w-5 h-5", title: "text-sm", desc: "text-xs", mascotSize: "w-16 h-16" },
  md: { py: "py-12", icon: "w-14 h-14", iconInner: "w-7 h-7", title: "text-base", desc: "text-sm", mascotSize: "w-24 h-24" },
  lg: { py: "py-16", icon: "w-16 h-16", iconInner: "w-8 h-8", title: "text-lg", desc: "text-sm", mascotSize: "w-32 h-32" },
};

const EmptyState = ({ icon, mascot, title, description, action, size = "md", className }: EmptyStateProps) => {
  const s = sizeConfig[size];

  return (
    <div className={cn("text-center flex flex-col items-center", s.py, className)}>
      {mascot ? (
        <motion.img
          src="/assets/mascot.png"
          alt="Pingo"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={cn("object-contain mb-4", s.mascotSize)}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : icon ? (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={cn(
            "mx-auto rounded-2xl bg-muted/60 dark:bg-muted/30 flex items-center justify-center mb-4",
            s.icon
          )}
        >
          <span className={cn("text-muted-foreground [&>svg]:w-full [&>svg]:h-full", s.iconInner)}>{icon}</span>
        </motion.div>
      ) : null}

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn("font-semibold text-foreground mb-1", s.title)}
      >
        {title}
      </motion.p>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={cn("text-muted-foreground max-w-sm mx-auto mb-5", s.desc)}
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button
            size={size === "sm" ? "sm" : "default"}
            variant={action.variant ?? "default"}
            className="rounded-xl"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default EmptyState;
export { EmptyState };
export type { EmptyStateProps };
