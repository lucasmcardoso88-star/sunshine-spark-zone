import { MONTHS_PT, formatBRL } from "@/lib/format";
import type { MonthlyKpi } from "@/data/mock";
import { cn } from "@/lib/utils";

type Row = {
  label: string;
  key:
    | keyof MonthlyKpi
    | "_negTaxes"
    | "_negCommissions"
    | "_negCosts"
    | "_negCommercial"
    | "_negAdmin"
    | "_negOpEx"
    | "_negFinExp";
  emphasis?: "subtotal" | "total";
};

const ROWS: Row[] = [
  { label: "Receita Bruta", key: "grossRevenue" },
  { label: "(-) Impostos sobre vendas", key: "_negTaxes" },
  { label: "(-) Comissões sobre vendas", key: "_negCommissions" },
  { label: "(=) Receita Líquida", key: "netRevenue", emphasis: "subtotal" },
  { label: "(-) Custo dos serviços prestados", key: "_negCosts" },
  { label: "(=) Lucro Bruto", key: "grossProfit", emphasis: "subtotal" },
  { label: "(-) Despesas Comerciais", key: "_negCommercial" },
  { label: "(-) Despesas Administrativas", key: "_negAdmin" },
  { label: "(-) Despesas Operacionais", key: "_negOpEx" },
  { label: "(=) EBITDA", key: "ebitda", emphasis: "subtotal" },
  { label: "(-) Despesas Financeiras", key: "_negFinExp" },
  { label: "(+) Receitas Financeiras", key: "financialIncome" },
  { label: "(=) Lucro Líquido", key: "netProfit", emphasis: "total" },
];

function valueFor(k: MonthlyKpi, key: Row["key"]): number {
  switch (key) {
    case "_negTaxes":
      return -k.taxes;
    case "_negCommissions":
      return -k.commissions;
    case "_negCosts":
      return -k.operationalCosts;
    case "_negCommercial":
      return -k.commercialExpenses;
    case "_negAdmin":
      return -k.adminExpenses;
    case "_negOpEx":
      return -k.operationalExpenses;
    case "_negFinExp":
      return -k.financialExpense;
    default:
      return k[key] as number;
  }
}

export function DreTable({ data }: { data: MonthlyKpi[] }) {
  const months = data.map((d) => MONTHS_PT[d.monthIndex]);
  return (
    <div className="max-h-[70vh] overflow-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[920px] text-sm">
        <thead className="sticky top-0 z-20 bg-secondary text-xs uppercase tracking-wide text-muted-foreground shadow-sm">
          <tr>
            <th className="sticky left-0 z-30 bg-secondary px-4 py-3 text-left">Linha</th>
            {months.map((m) => (
              <th key={m} className="text-right px-3 py-3 whitespace-nowrap">
                {m}
              </th>
            ))}
            <th className="bg-primary/10 px-4 py-3 text-right whitespace-nowrap text-primary-deep">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, rowIndex) => {
            const cells = data.map((k) => valueFor(k, row.key));
            const total = cells.reduce((a, b) => a + b, 0);
            return (
              <tr
                key={row.label}
                className={cn(
                  "border-t border-border odd:bg-secondary/20",
                  row.emphasis === "subtotal" && "bg-primary/5 font-medium",
                  row.emphasis === "total" && "bg-primary/10 font-semibold",
                )}
              >
                <td
                  className={cn(
                    "sticky left-0 z-10 px-4 py-2 bg-card",
                    rowIndex % 2 === 0 && "bg-secondary/20",
                    row.emphasis === "subtotal" && "bg-primary/5",
                    row.emphasis === "total" && "bg-primary/10",
                  )}
                >
                  {row.label}
                </td>
                {cells.map((v, i) => (
                  <td
                    key={i}
                    className={cn(
                      "px-3 py-2 text-right tabular-nums whitespace-nowrap",
                      v < 0 ? "text-destructive" : "text-primary-deep",
                    )}
                  >
                    {formatBRL(v)}
                  </td>
                ))}
                <td
                  className={cn(
                    "bg-primary/10 px-4 py-2 text-right tabular-nums whitespace-nowrap font-semibold",
                    total < 0 ? "text-destructive" : "text-primary-deep",
                  )}
                >
                  {formatBRL(total)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
