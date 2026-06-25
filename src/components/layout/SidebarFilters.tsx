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
        "shrink-0 border-b border-border bg-card/70 transition-[width] lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r",
        collapsed ? "lg:w-20" : "lg:w-72",
      )}
    >
      <div className="p-4 space-y-4 lg:sticky lg:top-16">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-primary" />
            {!collapsed && (
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Filtros
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "Expandir filtros" : "Recolher filtros"}
            className="hidden h-9 w-9 lg:inline-flex"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {collapsed ? (
          <div className="hidden justify-center lg:flex">
            <StatusBadge tone={activeFilterCount ? "info" : "neutral"}>
              {activeFilterCount}
            </StatusBadge>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <StatusBadge tone={activeFilterCount ? "info" : "neutral"}>
                Filtros aplicados: {activeFilterCount}
              </StatusBadge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="gap-1 text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Limpar filtros
              </Button>
            </div>

            <Card className="grid gap-4 rounded-2xl border-border p-4 shadow-none sm:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-2">
                <Label className="text-xs">Empresa</Label>
                <Select value={company} onValueChange={(v) => setCompany(v as CompanyId)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_OPTIONS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Ano</Label>
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Trimestre</Label>
                <Select
                  value={String(quarter)}
                  onValueChange={(v) => setQuarter(v === "all" ? "all" : (Number(v) as Quarter))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os trimestres</SelectItem>
                    <SelectItem value="1">1º Trimestre</SelectItem>
                    <SelectItem value="2">2º Trimestre</SelectItem>
                    <SelectItem value="3">3º Trimestre</SelectItem>
                    <SelectItem value="4">4º Trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Mês</Label>
                <Select
                  value={String(month)}
                  onValueChange={(v) => setMonth(v === "all" ? "all" : Number(v))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {MONTHS_PT.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Tipo</Label>
                <Select value={basis} onValueChange={(v) => setBasis(v as "cash" | "accrual")}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accrual">Competência</SelectItem>
                    <SelectItem value="cash">Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Centro de custo</Label>
                <Select value={costCenter} onValueChange={setCostCenter}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os centros</SelectItem>
                    {COST_CENTERS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Início personalizado</Label>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Fim personalizado</Label>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-10"
                />
              </div>
            </Card>

            <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
              Dados reais sincronizados do Conta Azul — W2 Publicidade · base 2023
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
