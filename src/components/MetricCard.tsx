import { type ElementType } from "react";

export function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: ElementType;
  color: string;
}) {
  return (
    <div className={`rounded-xl border-2 border-foreground ${color} p-4 text-foreground`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest opacity-75">{label}</div>
          <div className="mt-2 font-display text-2xl font-bold">{value}</div>
          {sublabel && <div className="mt-1 text-xs opacity-75">{sublabel}</div>}
        </div>
        <Icon className="h-5 w-5 opacity-60" />
      </div>
    </div>
  );
}