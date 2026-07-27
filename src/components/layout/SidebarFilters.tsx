import { useState } from "react";
import { ChevronLeft, ChevronRight, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useFilters, type Quarter } from "@/context/FiltersContext";
import {
  COMPANY_OPTIONS,
  COST_CENTERS,
  EXPENSE_CATEGORIES,
  SERVICE_TYPES,
  YEARS,
  type CompanyId,
} from "@/data/mock";
import { MONTHS_PT } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SidebarFilters() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    year,
    setYear,
    quarter,
    setQuarter,
    month,
    setMonth,
    basis,
    setBasis,
    company,
    setCompany,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    costCenter,
    setCostCenter,
    category,
    setCategory,
    resetFilters,
    activeFilterCount,
  } = useFilters();
  const categories = Array.from(new Set([...SERVICE_TYPES, ...EXPENSE_CATEGORIES]));

  return (
    <aside
      className={cn(
        "shrink-0 border-b border-border bg-sidebar transition-all duration-300 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:border-border",
        collapsed ? "lg:w-20" : "lg:w-80",
      )}
    >
      <div className="p-6 space-y-6 lg:sticky lg:top-16">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Filtros Inteligentes
              </p>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        {collapsed ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Filter size={18} />
            </div>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border">
              {activeFilterCount}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-[10px] font-bold text-primary uppercase">{activeFilterCount} Ativos</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Resetar
              </Button>
            </div>

            <div className="space-y-5">
              <FilterField label="Empresa Principal">
                <Select value={company} onValueChange={(v) => setCompany(v as CompanyId)}>
                  <SelectTrigger className="h-11 rounded-xl bg-muted border-border text-foreground font-medium focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {COMPANY_OPTIONS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>

              <div className="grid grid-cols-2 gap-4">
                <FilterField label="Ano Fiscal">
                  <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                    <SelectTrigger className="h-11 rounded-xl bg-muted border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>

                <FilterField label="Mês">
                  <Select value={String(month)} onValueChange={(v) => setMonth(v === "all" ? "all" : Number(v))}>
                    <SelectTrigger className="h-11 rounded-xl bg-muted border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="all">Todos</SelectItem>
                      {MONTHS_PT.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)}>{m.substring(0, 3)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>
              </div>

              <FilterField label="Base de Cálculo">
                <Select value={basis} onValueChange={(v) => setBasis(v as "cash" | "accrual")}>
                  <SelectTrigger className="h-11 rounded-xl bg-muted border-border text-foreground uppercase text-[10px] font-bold tracking-widest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="accrual">Competência (DRE)</SelectItem>
                    <SelectItem value="cash">Caixa (Fluxo)</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>

              <FilterField label="Categoria Financeira">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 rounded-xl bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
              
              <div className="pt-4 border-t border-border">
                <p className="text-[10px] font-medium text-muted-foreground italic leading-relaxed">
                  * Os dados são processados em tempo real de acordo com as normas internacionais de controladoria.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{label}</Label>
      {children}
    </div>
  );
}
