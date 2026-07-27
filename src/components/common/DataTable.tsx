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
    <div className="max-h-[640px] overflow-auto rounded-2xl border border-border/70 bg-card">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <TableRow className="border-border/70 hover:bg-transparent">
            {columns.map((c) => (
              <TableHead
                key={c.key}
                className={`h-11 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${c.className ?? ""}`}
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
              className="border-border/50 transition-colors hover:bg-muted/40"
            >
              {columns.map((c) => (
                <TableCell
                  key={c.key}
                  className={`py-3 text-sm tabular-nums ${c.className ?? ""}`}
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
