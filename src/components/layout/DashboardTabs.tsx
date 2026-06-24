import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  CreditCard,
  LineChart,
  ReceiptText,
  Settings,
  Table2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Painel Gerencial", icon: BarChart3 },
  { to: "/dre", label: "DRE", icon: Table2 },
  { to: "/previsto-realizado", label: "Previsto x Realizado", icon: TrendingUp },
  { to: "/fluxo-caixa", label: "Fluxo de Caixa", icon: LineChart },
  { to: "/receitas", label: "Receitas", icon: ReceiptText },
  { to: "/despesas", label: "Despesas", icon: CreditCard },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function DashboardTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="border-b border-border bg-card">
      <div className="flex gap-1 overflow-x-auto px-4 [scrollbar-width:thin] sm:px-6 lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const active = t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "relative inline-flex items-center gap-2 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors sm:px-4",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {active && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
