import { cn } from "@/lib/utils";

/** Título estático (sem animação de digitação). */
export function GlyphText({ text, className }: { text: string; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{text}</span>;
}
