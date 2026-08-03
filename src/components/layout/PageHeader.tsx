import { GlyphText } from "@/components/fx/GlyphText";

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="relative mb-6 overflow-hidden pb-5">
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, var(--neon) 60%, transparent), transparent)",
        }}
      />
      <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-[color:var(--neon)]">
        Sistema
      </p>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground neon-text sm:text-3xl">
        <GlyphText text={title} />
      </h1>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
