import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MONTHS_PT, formatBRL } from "@/lib/format";
import type { MonthlyKpi, Transaction } from "@/data/mock";
import { getLocalMonthIndex } from "@/lib/date";
import { cn } from "@/lib/utils";
import { classifyTransaction, type DreLine } from "@/lib/dre-classify";


type RowKey =
  | keyof MonthlyKpi
  | "_negTaxes"
  | "_negCommissions"
  | "_negCosts"
  | "_negCommercial"
  | "_negAdmin"
  | "_negOpEx"
  | "_negFinExp";

type Row = {
  label: string;
  key: RowKey;
  emphasis?: "subtotal" | "total";
  /** linha do DRE usada para abrir o detalhamento por categoria */
  detail?: DreLine;
};

const ROWS: Row[] = [
  { label: "Receita Bruta", key: "grossRevenue", detail: "grossRevenue" },
  { label: "(-) Impostos sobre vendas", key: "_negTaxes", detail: "taxes" },
  { label: "(-) Comissões sobre vendas", key: "_negCommissions", detail: "commissions" },
  { label: "(=) Receita Líquida", key: "netRevenue", emphasis: "subtotal" },
  { label: "(-) Custo dos serviços prestados", key: "_negCosts", detail: "operationalCosts" },
  { label: "(=) Lucro Bruto", key: "grossProfit", emphasis: "subtotal" },
  { label: "(-) Despesas Comerciais", key: "_negCommercial", detail: "commercialExpenses" },
  { label: "(-) Despesas Administrativas", key: "_negAdmin", detail: "adminExpenses" },
  { label: "(-) Despesas Operacionais", key: "_negOpEx", detail: "operationalExpenses" },
  { label: "(=) EBITDA", key: "ebitda", emphasis: "subtotal" },
  { label: "(-) Despesas Financeiras", key: "_negFinExp", detail: "financialExpense" },
  { label: "(+) Receitas Financeiras", key: "financialIncome", detail: "financialIncome" },
  { label: "(=) Lucro Líquido", key: "netProfit", emphasis: "total" },
];

function valueFor(k: MonthlyKpi, key: RowKey): number {
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

/** Mesma classificação usada em src/lib/finance.ts */
function bucketOf(t: Transaction): DreLine {
  return classifyTransaction(t.type, t.category || "Sem categoria");
}

const POSITIVE_LINES: DreLine[] = ["grossRevenue", "financialIncome"];



function amountClass(v: number) {
  if (v > 0) return "neon-pos";
  if (v < 0) return "neon-neg";
  return "text-muted-foreground";
}


export function DreTable({
  data,
  transactions = [],
}: {
  data: MonthlyKpi[];
  transactions?: Transaction[];
}) {
  const months = data.map((d) => MONTHS_PT[d.monthIndex]);
  const monthIndexes = data.map((d) => d.monthIndex);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  /** detail bucket -> category -> monthIndex -> amount */
  const details = useMemo(() => {
    const map = new Map<string, Map<string, Map<number, number>>>();
    for (const t of transactions) {
      const bucket = bucketOf(t);
      if (!bucket) continue;
      const m = getLocalMonthIndex(t.date);
      if (m == null) continue;
      const cat = t.category || "Sem categoria";
      const byCat = map.get(bucket) ?? new Map();
      map.set(bucket, byCat);
      const byMonth = byCat.get(cat) ?? new Map<number, number>();
      byCat.set(cat, byMonth);
      byMonth.set(m, (byMonth.get(m) ?? 0) + t.amount);
    }
    return map;
  }, [transactions]);

  return (
    <div className="holo max-h-[70vh] overflow-auto">
      <table className="w-full min-w-[920px] text-sm">
        <thead className="hud-sticky-head text-[10px] tracking-[0.2em] text-[color:var(--neon)]">
          <tr>
            <th className="hud-sticky-col z-30 px-4 py-3 text-left">Linha</th>
            {months.map((m, mi) => (
              <th key={`${m}-${mi}`} className="text-right px-3 py-3 whitespace-nowrap">
                {m}
              </th>
            ))}
            <th className="bg-[color:var(--neon)]/12 px-4 py-3 text-right whitespace-nowrap">
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {ROWS.map((row, rowIndex) => {
            const cells = data.map((k) => valueFor(k, row.key));
            const total = cells.reduce((a, b) => a + b, 0);
            const subs = row.detail ? details.get(row.detail) : undefined;
            const canExpand = Boolean(subs && subs.size > 0);
            const isOpen = Boolean(open[row.label]);
            const sign = row.detail && !POSITIVE_LINES.includes(row.detail) ? -1 : 1;

            return (
              <Fragment key={row.label}>
                <tr
                  onClick={() => canExpand && setOpen((s) => ({ ...s, [row.label]: !s[row.label] }))}
                  style={{ animationDelay: `${Math.min(rowIndex, 20) * 30}ms` }}
                  className={cn(
                    "hud-row hud-row-hover border-t border-border/50",
                    canExpand &&
                      "cursor-pointer",

                    row.emphasis === "subtotal" && "bg-[color:var(--neon)]/6 font-medium",
                    row.emphasis === "total" && "bg-[color:var(--neon)]/12 font-semibold",
                  )}
                >
                  <td
                    className={cn(
                      "hud-sticky-col px-4 py-2 text-foreground",
                      row.emphasis === "subtotal" && "font-medium",
                      row.emphasis === "total" && "font-semibold neon-text",
                    )}
                  >

                    <span className="flex items-center gap-1.5">
                      {canExpand ? (
                        isOpen ? (
                          <ChevronDown size={14} className="text-[color:var(--neon)]" />
                        ) : (
                          <ChevronRight size={14} className="text-muted-foreground" />
                        )
                      ) : (
                        <span className="w-[14px]" />
                      )}
                      {row.label}
                    </span>
                  </td>
                  {cells.map((v, i) => (
                    <td
                      key={i}
                      className={cn(
                        "px-3 py-2 text-right tabular-nums whitespace-nowrap font-medium",
                        amountClass(v),
                      )}
                    >
                      {formatBRL(v)}
                    </td>
                  ))}
                  <td
                    className={cn(
                      "bg-[color:var(--neon)]/12 px-4 py-2 text-right tabular-nums whitespace-nowrap font-semibold",
                      amountClass(total),
                    )}
                  >
                    {formatBRL(total)}
                  </td>
                </tr>

                {isOpen && subs
                  ? [...subs.entries()]
                      .map(([cat, byMonth]) => {
                        const values = monthIndexes.map((m) => sign * (byMonth.get(m) ?? 0));
                        return { cat, values, total: values.reduce((a, b) => a + b, 0) };
                      })
                      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
                      .map((sub, si) => (
                        <tr
                          key={`${row.label}-${sub.cat}`}
                          style={{ animationDelay: `${Math.min(si, 16) * 25}ms` }}
                          className="hud-row hud-row-hover-soft border-t border-border/40 bg-muted/20"
                        >
                          <td className="hud-sticky-col px-4 py-1.5 pl-10 text-xs text-muted-foreground">
                            {sub.cat}
                          </td>

                          {sub.values.map((v, i) => (
                            <td
                              key={i}
                              className={cn(
                                "px-3 py-1.5 text-right text-xs tabular-nums whitespace-nowrap",
                                amountClass(v),
                              )}
                            >
                              {v === 0 ? "—" : formatBRL(v)}
                            </td>
                          ))}
                          <td
                            className={cn(
                              "bg-primary/5 px-4 py-1.5 text-right text-xs tabular-nums whitespace-nowrap font-medium",
                              amountClass(sub.total),
                            )}
                          >
                            {formatBRL(sub.total)}
                          </td>
                        </tr>
                      ))
                  : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
