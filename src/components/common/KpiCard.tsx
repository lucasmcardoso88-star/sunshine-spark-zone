import { ArrowDownRight, ArrowUpRight, HelpCircle, type LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatBRL, formatVariation } from "@/lib/format";
import { TiltCard } from "@/components/fx/TiltCard";
import { AnimatedNumber } from "@/components/fx/AnimatedNumber";

export type KpiTone = "positive" | "warning" | "critical" | "neutral";

const TONE_ACCENT: Record<KpiTone, string> = {
  positive: "var(--success)",
  warning: "var(--warning)",
  critical: "var(--destructive)",
  neutral: "var(--neon)",
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
  const max = trend?.length ? trend.reduce((acc, n) => Math.max(acc, Math.abs(Number(n) || 0)), 1) : 1;

  return (
    <TiltCard className="overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p className="min-w-0 truncate text-[11px] font-bold tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `color-mix(in oklab, ${accent} 16%, transparent)`,
              color: accent,
              boxShadow: `0 0 22px -8px ${accent}`,
            }}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "mt-3 font-semibold tabular-nums tracking-tight",
          size === "lg" ? "text-[28px] leading-tight" : "text-[22px] leading-tight",
          value == null ? "text-foreground" : value < 0 ? "text-destructive" : "text-foreground",
        )}
      >
        {value == null ? (
          "—"
        ) : (
          <AnimatedNumber value={value} format={formatValue ?? formatBRL} />
        )}
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
                className="hud-bar w-full max-w-[6px] rounded-full"
                style={{
                  height: `${Math.max(12, (Math.abs(v) / max) * 100)}%`,
                  background: accent,
                  boxShadow: `0 0 10px -2px ${accent}`,
                  opacity: 0.3 + (i / Math.max(trend.length - 1, 1)) * 0.7,
                  animationDelay: `${i * 45}ms`,
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </TiltCard>
  );
}
