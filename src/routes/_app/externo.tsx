import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  listExternalTables,
  getExternalTableRows,
} from "@/lib/external-supabase.functions";

export const Route = createFileRoute("/_app/externo")({
  head: () => ({ meta: [{ title: "Supabase Externo — Admin" }] }),
  component: ExternoPage,
});

function useIsAdmin() {
  const [state, setState] = useState<{ loading: boolean; isAdmin: boolean }>({
    loading: true,
    isAdmin: false,
  });
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setState({ loading: false, isAdmin: false });
        return;
      }
      const { data } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      setState({ loading: false, isAdmin: Boolean(data) });
    })();
  }, []);
  return state;
}

function ExternoPage() {
  const { loading, isAdmin } = useIsAdmin();
  const listFn = useServerFn(listExternalTables);
  const rowsFn = useServerFn(getExternalTableRows);
  const [selected, setSelected] = useState<string>("");

  const tablesQuery = useQuery({
    queryKey: ["external", "tables"],
    queryFn: () => listFn(),
    enabled: isAdmin,
  });

  const rowsQuery = useQuery({
    queryKey: ["external", "rows", selected],
    queryFn: () => rowsFn({ data: { table: selected, limit: 50 } }),
    enabled: isAdmin && !!selected,
  });

  const columns = useMemo(() => {
    const rows = rowsQuery.data?.rows ?? [];
    return rows.length ? Object.keys(rows[0]) : [];
  }, [rowsQuery.data]);

  if (loading) return <LoadingState label="Verificando permissões…" />;
  if (!isAdmin)
    return (
      <>
        <PageHeader title="Acesso restrito" />
        <EmptyState
          title="Apenas administradores"
          description="Faça login com uma conta admin para acessar o Supabase externo."
        />
      </>
    );

  return (
    <>
      <PageHeader
        title="Supabase Externo"
        description="Explorador admin de tabelas do projeto externo."
      />

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="min-w-[280px]">
          <label className="block text-xs text-muted-foreground mb-1">Tabela</label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue
                placeholder={tablesQuery.isLoading ? "Carregando…" : "Selecione uma tabela"}
              />
            </SelectTrigger>
            <SelectContent>
              {(tablesQuery.data?.tables ?? []).map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            tablesQuery.refetch();
            if (selected) rowsQuery.refetch();
          }}
        >
          Atualizar
        </Button>
      </div>

      {tablesQuery.error ? (
        <EmptyState
          title="Erro ao listar tabelas"
          description={(tablesQuery.error as Error).message}
        />
      ) : null}

      {selected ? (
        rowsQuery.isLoading ? (
          <LoadingState label={`Carregando ${selected}…`} />
        ) : rowsQuery.error ? (
          <EmptyState
            title="Erro ao carregar linhas"
            description={(rowsQuery.error as Error).message}
          />
        ) : (rowsQuery.data?.rows ?? []).length === 0 ? (
          <EmptyState title="Sem linhas" />
        ) : (
          <div className="overflow-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowsQuery.data!.rows.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {columns.map((c) => (
                      <td key={c} className="px-3 py-2 align-top">
                        <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                          {formatCell(row[c])}
                        </pre>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <EmptyState title="Escolha uma tabela para ver as linhas" />
      )}
    </>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}
