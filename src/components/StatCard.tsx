import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  unit,
  icon,
  accent = "primary",
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: ReactNode;
  accent?: "primary" | "success" | "warning" | "destructive";
  delay?: number;
}) {
  const ring: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">
            {value}
            {unit && <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>}
          </div>
        </div>
        {icon && <div className={`h-10 w-10 rounded-lg grid place-items-center ${ring[accent]}`}>{icon}</div>}
      </div>
    </motion.div>
  );
}