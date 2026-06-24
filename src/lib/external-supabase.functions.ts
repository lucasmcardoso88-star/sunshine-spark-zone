import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EXTERNAL_SUPABASE_URL = "https://naxuhmhkwejaggxjpmgx.supabase.co";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(`Falha ao verificar papel: ${error.message}`);
  if (!data) throw new Error("Forbidden: admin required");
}

function adminFetch(path: string, init?: RequestInit) {
  const key = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY não configurada");
  const headers = new Headers(init?.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  return fetch(`${EXTERNAL_SUPABASE_URL}${path}`, { ...init, headers });
}

export const listExternalTables = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    // PostgREST expõe OpenAPI no root; usamos para descobrir tabelas do schema public
    const res = await adminFetch("/rest/v1/", { headers: { Accept: "application/openapi+json" } });
    if (!res.ok) throw new Error(`OpenAPI ${res.status}: ${await res.text()}`);
    const spec: any = await res.json();
    const tables = Object.keys(spec?.definitions ?? spec?.components?.schemas ?? {}).sort();
    return { tables };
  });

export const getExternalTableRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        table: z
          .string()
          .min(1)
          .max(120)
          .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Nome de tabela inválido"),
        limit: z.number().int().min(1).max(200).optional().default(50),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const res = await adminFetch(
      `/rest/v1/${encodeURIComponent(data.table)}?select=*&limit=${data.limit}`,
    );
    if (!res.ok) throw new Error(`REST ${res.status}: ${await res.text()}`);
    const rows = (await res.json()) as any[];
    return { rows };
  });
