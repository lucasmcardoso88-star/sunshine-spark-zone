import { AlertTriangle, CheckCircle2, Clock, FileText, Route, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AlertEvent } from "@/data/mock";
import { formatBRL, formatDate } from "@/lib/format";
import { StatusBadge, type Tone } from "./StatusBadge";

const SEVERITY: Record<AlertEvent["severity"], { tone: Tone; label: string }> = {
  low: { tone: "info", label: "Baixa" },
  medium: { tone: "warning", label: "Média" },
  high: { tone: "critical", label: "Alta" },
  critical: { tone: "critical", label: "Crítica" },
};

const STATUS: Record<AlertEvent["status"], { tone: Tone; label: string; icon: React.ElementType }> =
  {
    open: { tone: "warning", label: "Aberto", icon: AlertTriangle },
    in_review: { tone: "info", label: "Em análise", icon: Clock },
    resolved: { tone: "positive", label: "Resolvido", icon: CheckCircle2 },
  };

export function AlertCard({ alert, onResolve }: { alert: AlertEvent; onResolve?: () => void }) {
  const sev = SEVERITY[alert.severity];
  const st = STATUS[alert.status];
  const StIcon = st.icon;
  return (
    <Card
      className={`rounded-2xl border-border p-5 shadow-sm ${alert.severity === "critical" ? "ring-1 ring-destructive/30" : ""}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
            <StatusBadge tone={sev.tone}>Severidade {sev.label}</StatusBadge>
            <StatusBadge tone={st.tone}>
              <StIcon className="h-3 w-3" /> {st.label}
            </StatusBadge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{alert.description}</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Impacto financeiro estimado</p>
              <p
                className={`text-sm font-semibold ${alert.financialImpact < 0 ? "text-destructive" : "text-[color:var(--success)]"}`}
              >
                {formatBRL(alert.financialImpact)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Recomendação</p>
              <p className="text-foreground">{alert.recommendation}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <FileText className="h-4 w-4" /> Ver detalhe
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>{alert.title}</SheetTitle>
                  <SheetDescription>
                    Detalhamento do desvio financeiro e recomendação de ação.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-5">
                  <section className="rounded-2xl border border-border p-4">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">
                      Descrição
                    </p>
                    <p className="mt-2 text-sm text-foreground">{alert.description}</p>
                  </section>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <section className="rounded-2xl border border-border p-4">
                      <p className="text-xs font-medium tracking-wide text-muted-foreground">
                        Impacto financeiro
                      </p>
                      <p
                        className={`mt-2 text-lg font-semibold ${alert.financialImpact < 0 ? "text-destructive" : "text-[color:var(--success)]"}`}
                      >
                        {formatBRL(alert.financialImpact)}
                      </p>
                    </section>
                    <section className="rounded-2xl border border-border p-4">
                      <p className="text-xs font-medium tracking-wide text-muted-foreground">
                        Valores comparados
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        Realizado vs meta/orçamento do período filtrado.
                      </p>
                    </section>
                  </div>
                  <section className="rounded-2xl border border-border p-4">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">
                      Recomendação
                    </p>
                    <p className="mt-2 text-sm text-foreground">{alert.recommendation}</p>
                  </section>
                  <section className="rounded-2xl border border-border p-4">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">
                      Origem do dado
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Motor interno de alertas
                      financeiros
                    </div>
                  </section>
                  <section className="rounded-2xl border border-border p-4">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">
                      Timeline
                    </p>
                    <ol className="mt-3 space-y-3 text-sm text-foreground">
                      <li className="flex gap-2">
                        <Route className="mt-0.5 h-4 w-4 text-primary" /> Gerado em{" "}
                        {formatDate(alert.createdAt)}
                      </li>
                      <li className="flex gap-2">
                        <Clock className="mt-0.5 h-4 w-4 text-primary" /> Aguardando revisão da
                        controladoria
                      </li>
                    </ol>
                  </section>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="outline">
                      Criar tarefa
                    </Button>
                    <Button type="button" onClick={onResolve}>
                      Marcar como resolvido
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            {alert.status !== "resolved" ? (
              <Button type="button" variant="ghost" size="sm" onClick={onResolve}>
                <CheckCircle2 className="h-4 w-4" /> Resolver
              </Button>
            ) : null}
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(alert.createdAt)}
        </div>
      </div>
    </Card>
  );
}
