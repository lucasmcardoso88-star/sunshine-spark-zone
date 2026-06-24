import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { DreTable } from "@/components/common/DreTable";
import { EmptyState } from "@/components/common/EmptyState";
import { useFilters } from "@/context/FiltersContext";
import { getMonthlyKpis } from "@/lib/finance";

export const Route = createFileRoute("/_app/dre")({
  head: () => ({
    meta: [
      { title: "DRE — Controladoria Agência" },
      { name: "description", content: "Demonstração de Resultados do Exercício mensal." },
    ],
  }),
  component: DrePage,
});

function DrePage() {
  const filters = useFilters();
  // Always show the whole year for the DRE — but respect quarter filter if set
  const data = getMonthlyKpis({ ...filters, month: "all" });
  return (
    <>
      <PageHeader title="DRE" description={`Demonstração de Resultados • ${filters.year}`} />
      {data.length === 0 ? <EmptyState /> : <DreTable data={data} />}
    </>
  );
}