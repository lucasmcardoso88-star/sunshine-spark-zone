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
  { to: "/dashboard", label: "Dashboard", icon: LineChart },
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
    <nav className="relative border-b border-border/70 bg-background/40 py-1 backdrop-blur-xl">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, var(--neon) 55%, transparent), transparent)",
        }}
      />
      <div className="flex gap-2 overflow-x-auto px-6 [scrollbar-width:thin] lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const active = t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "relative inline-flex items-center gap-2.5 whitespace-nowrap rounded-t-xl px-4 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-300",
                active
                  ? "text-[color:var(--neon)] neon-text"
                  : "text-muted-foreground hover:text-foreground",
              )}
              style={
                active
                  ? {
                      background:
                        "linear-gradient(to top, color-mix(in oklab, var(--neon) 16%, transparent), transparent)",
                    }
                  : undefined
              }
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {active && (
                <>
                  <span
                    className="absolute inset-x-2 bottom-0 h-[2px] rounded-full transition-all duration-300"
                    style={{
                      background: "linear-gradient(90deg, transparent, var(--neon), transparent)",
                      boxShadow: "0 0 14px 2px var(--hud-glow)",
                    }}
                  />
                  <span
                    className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                    style={{ background: "var(--neon)", boxShadow: "0 0 12px 3px var(--hud-glow)" }}
                  />
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
