import { Loader2 } from "lucide-react";

export function LoadingState({ label = "faça oq eu pedi" }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        {label}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-secondary" />
        <div className="h-24 animate-pulse rounded-xl bg-secondary" />
        <div className="h-24 animate-pulse rounded-xl bg-secondary" />
      </div>
    </div>
  );
}
