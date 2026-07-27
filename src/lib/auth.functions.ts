import { createServerFn } from "@tanstack/react-start";

const DEFAULT_EMAIL = "financeiro@agenciaw2.com.br";
const DEFAULT_PASSWORD = "AgenciaW2@2026";

export const ensureDefaultUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Check if user already exists
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error(listErr.message);

  const existing = list.users.find(
    (u) => (u.email ?? "").toLowerCase() === DEFAULT_EMAIL.toLowerCase(),
  );
  if (existing) return { ok: true, created: false };

  // Create WITHOUT email_confirm — user must verify via OTP on first access
  const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
    email_confirm: false,
  });
  if (createErr) throw new Error(createErr.message);

  return { ok: true, created: true };
});
