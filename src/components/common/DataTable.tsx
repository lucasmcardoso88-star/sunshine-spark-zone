import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./EmptyState";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  emptyTitle,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyTitle?: string;
}) {
  if (rows.length === 0)
    return (
      <EmptyState
        title={emptyTitle ?? "Sem registros"}
        description="Ajuste os filtros ou selecione outro período para continuar."
        actionLabel="Revisar filtros"
      />
    );
  return (
    <div className="holo max-h-[640px] overflow-auto">
      <Table>
        <TableHeader className="hud-sticky-head">
          <TableRow className="border-border/70 hover:bg-transparent">
            {columns.map((c, ci) => (
              <TableHead
                key={c.key}
                className={`h-11 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--neon)] ${
                  ci === 0 ? "hud-sticky-col" : ""
                } ${c.className ?? ""}`}
              >
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow
              key={i}
              className="hud-row hud-row-hover group border-border/40"
              style={{ animationDelay: `${Math.min(i, 24) * 28}ms` }}
            >
              {columns.map((c, ci) => (
                <TableCell
                  key={c.key}
                  className={`py-3 text-sm tabular-nums ${ci === 0 ? "hud-sticky-col font-medium" : ""} ${c.className ?? ""}`}
                >
                  {c.cell(r)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
