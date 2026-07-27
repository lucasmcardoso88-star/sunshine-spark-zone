import { ArrowDownRight, ArrowUpRight, HelpCircle, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatBRL, formatVariation } from "@/lib/format";

export type KpiTone = "positive" | "warning" | "critical" | "neutral";

const TONE_ACCENT: Record<KpiTone, string> = {
  positive: "var(--success)",
  warning: "var(--warning)",
  critical: "var(--destructive)",
  neutral: "var(--primary)",
};

export function KpiCard({
  label,
  value,
  variation,
  tone = "neutral",
  icon: Icon,
  formatValue,
  formula,
  trend,
  size = "md",
}: {
  label: string;
  value: number | null;
  variation?: number | null;
  tone?: KpiTone;
  icon?: LucideIcon;
  formatValue?: (n: number) => string;
  formula?: string;
  trend?: number[];
  size?: "md" | "lg";
}) {
  const positive = (variation ?? 0) >= 0;
  const accent = TONE_ACCENT[tone];
  const max = trend?.length ? Math.max(...trend.map((n) => Math.abs(n)), 1) : 1;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-border/70 bg-card p-5 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-[0_16px_40px_-24px_rgb(0_0_0/0.45)]">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p className="min-w-0 truncate text-[13px] font-medium text-muted-foreground">{label}</p>
          {formula ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Ver fórmula de ${label}`}
                    className="rounded-full text-muted-foreground/60 transition-colors hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">{formula}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
        {Icon ? (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `color-mix(in oklab, ${accent} 14%, transparent)`, color: accent }}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "mt-3 font-semibold tabular-nums tracking-tight",
          size === "lg" ? "text-[28px] leading-tight" : "text-[22px] leading-tight",
          (value ?? 0) < 0 ? "text-destructive" : "text-foreground",
        )}
      >
        {value == null ? "—" : formatValue ? formatValue(value) : formatBRL(value)}
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        {variation != null ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
              positive
                ? "bg-[color:var(--success)]/12 text-[color:var(--success)]"
                : "bg-destructive/12 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {formatVariation(variation)}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">Período selecionado</span>
        )}

        {trend?.length ? (
          <div className="flex h-9 flex-1 items-end justify-end gap-[3px]" aria-hidden>
            {trend.map((v, i) => (
              <span
                key={i}
                className="w-full max-w-[6px] rounded-full transition-opacity"
                style={{
                  height: `${Math.max(12, (Math.abs(v) / max) * 100)}%`,
                  background: accent,
                  opacity: 0.25 + (i / Math.max(trend.length - 1, 1)) * 0.75,
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
