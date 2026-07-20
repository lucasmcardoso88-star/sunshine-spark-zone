import { createServerFn } from "@tanstack/react-start";

const D61_URL = "https://ysxdfrjgjoahefkremmc.supabase.co";

async function fetchAllD61(table: "receitas" | "despesas") {
  const key = process.env.D61_SUPABASE_SERVICE_ROLE_KEY!;
  const pageSize = 1000;
  const rows: any[] = [];
  for (let from = 0; ; from += pageSize) {
    const res = await fetch(
      `${D61_URL}/rest/v1/${table}?select=*&order=data_vencimento.asc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Range: `${from}-${from + pageSize - 1}`,
          "Range-Unit": "items",
        },
      },
    );
    if (!res.ok) throw new Error(`D61 ${table} ${res.status}: ${await res.text()}`);
    const batch = (await res.json()) as any[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

export const getD61Data = createServerFn({ method: "GET" }).handler(async () => {
  const [receitas, despesas] = await Promise.all([
    fetchAllD61("receitas").catch((err) => {
      console.error("[d61] receitas failed", err);
      return [] as any[];
    }),
    fetchAllD61("despesas").catch((err) => {
      console.error("[d61] despesas failed", err);
      return [] as any[];
    }),
  ]);
  return { receitas, despesas };
});
