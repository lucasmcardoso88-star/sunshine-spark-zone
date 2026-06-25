// Webhook ContaAzul → Supabase
// Recebe eventos de payable/receivable/sale e faz upsert nas tabelas
// despesas/receitas/vendas. Valida o header `x-contaazul-signature` contra
// o secret `CONTAAZUL_WEBHOOK_SECRET`. Registra cada evento em `sync_log`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("CONTAAZUL_WEBHOOK_SECRET") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type, x-contaazul-signature",
  "access-control-allow-methods": "POST, OPTIONS",
};

type DbStatus = "pending" | "paid" | "overdue" | "canceled";

function mapStatus(s: unknown): DbStatus {
  const v = String(s ?? "").toUpperCase();
  if (["PAID", "ACQUITTED", "SETTLED", "RECEIVED"].includes(v)) return "paid";
  if (["OVERDUE", "LATE"].includes(v)) return "overdue";
  if (["CANCELED", "CANCELLED"].includes(v)) return "canceled";
  return "pending";
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function log(
  tabela: string,
  evento: string,
  registro_id: string | null,
  status: "received" | "processed" | "error" | "rejected",
  mensagem?: string,
) {
  try {
    await admin.from("sync_log").insert({
      tabela,
      evento,
      registro_id,
      status,
      mensagem: mensagem ?? null,
    });
  } catch (e) {
    console.error("[sync_log] insert failed", e);
  }
}

function mapPayable(data: Record<string, unknown>) {
  return {
    id: String(data.id ?? data.uuid ?? crypto.randomUUID()),
    descricao: (data.description ?? data.descricao ?? null) as string | null,
    fornecedor: (data.supplier_name ??
      data.vendor_name ??
      data.fornecedor ??
      null) as string | null,
    categoria: (data.category_name ?? data.categoria ?? null) as string | null,
    centro_custo: (data.cost_center_name ?? data.centro_custo ?? null) as
      | string
      | null,
    valor: Number(data.value ?? data.amount ?? data.valor ?? 0),
    data_vencimento: (data.due_date ?? data.data_vencimento ?? null) as
      | string
      | null,
    data_pagamento: (data.payment_date ?? data.data_pagamento ?? null) as
      | string
      | null,
    status: mapStatus(data.status),
    raw: data,
  };
}

function mapReceivable(data: Record<string, unknown>) {
  return {
    id: String(data.id ?? data.uuid ?? crypto.randomUUID()),
    descricao: (data.description ?? data.descricao ?? null) as string | null,
    cliente: (data.customer_name ?? data.client_name ?? data.cliente ?? null) as
      | string
      | null,
    categoria: (data.category_name ?? data.categoria ?? null) as string | null,
    centro_custo: (data.cost_center_name ?? data.centro_custo ?? null) as
      | string
      | null,
    valor: Number(data.value ?? data.amount ?? data.valor ?? 0),
    data_vencimento: (data.due_date ?? data.data_vencimento ?? null) as
      | string
      | null,
    data_pagamento: (data.payment_date ?? data.data_pagamento ?? null) as
      | string
      | null,
    status: mapStatus(data.status),
    raw: data,
  };
}

function mapSale(data: Record<string, unknown>) {
  return {
    id: String(data.id ?? data.uuid ?? crypto.randomUUID()),
    numero: (data.number ?? data.numero ?? null) as string | null,
    cliente: (data.customer_name ?? data.client_name ?? data.cliente ?? null) as
      | string
      | null,
    descricao: (data.notes ?? data.description ?? data.descricao ?? null) as
      | string
      | null,
    valor: Number(data.total ?? data.value ?? data.amount ?? data.valor ?? 0),
    data: (data.emission ?? data.date ?? data.data ?? null) as string | null,
    status: mapStatus(data.status),
    raw: data,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS });
  }

  // Segurança — exige secret configurado
  if (!WEBHOOK_SECRET) {
    console.error("CONTAAZUL_WEBHOOK_SECRET não configurado");
    return new Response(JSON.stringify({ error: "server misconfigured" }), {
      status: 500,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  const sig =
    req.headers.get("x-contaazul-signature") ??
    req.headers.get("x-webhook-token") ??
    "";

  if (!safeEqual(sig, WEBHOOK_SECRET)) {
    await log("-", "-", null, "rejected", "invalid signature");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  const evento = String(payload.event ?? payload.type ?? "");
  const data =
    (payload.data as Record<string, unknown> | undefined) ??
    (payload.payload as Record<string, unknown> | undefined) ??
    payload;

  let tabela: "despesas" | "receitas" | "vendas";
  let row: Record<string, unknown>;

  if (evento.startsWith("financial_account.payable")) {
    tabela = "despesas";
    row = mapPayable(data);
  } else if (evento.startsWith("financial_account.receivable")) {
    tabela = "receitas";
    row = mapReceivable(data);
  } else if (evento.startsWith("sale.")) {
    tabela = "vendas";
    row = mapSale(data);
  } else {
    await log("-", evento || "unknown", null, "rejected", "unhandled event");
    // 200 para o ContaAzul não reenviar
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  const registroId = String(row.id);
  (row as Record<string, unknown>).conta_azul_event = evento;
  await log(tabela, evento, registroId, "received");

  const { error } = await admin.from(tabela).upsert(row, { onConflict: "id" });

  if (error) {
    console.error(`[webhook-contaazul] upsert ${tabela} falhou`, error);
    await log(tabela, evento, registroId, "error", error.message);
    // Devolve 200 para evitar reenvio em loop; erro fica no sync_log
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 200, headers: { ...CORS, "content-type": "application/json" } },
    );
  }

  await log(tabela, evento, registroId, "processed");
  return new Response(JSON.stringify({ ok: true, tabela, id: registroId }), {
    status: 200,
    headers: { ...CORS, "content-type": "application/json" },
  });
});
