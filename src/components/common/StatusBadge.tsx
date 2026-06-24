import { cn } from "@/lib/utils";

export type Tone = "positive" | "warning" | "critical" | "neutral" | "info";

const TONES: Record<Tone, string> = {
  positive:
    "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/30",
  warning:
    "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/30",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  neutral: "bg-secondary text-muted-foreground border-border",
  info: "bg-primary/10 text-primary border-primary/30",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
