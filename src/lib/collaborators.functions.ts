import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Collaborator = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string | null;
  lastSignInAt: string | null;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Apenas administradores podem gerenciar colaboradores.");
}

export const listCollaborators = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Collaborator[]> => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw new Error(error.message);

    const { data: profiles } = await supabaseAdmin
      .from("users_profiles")
      .select("user_id, full_name, role");
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role as string]));

    return list.users.map((u) => ({
      userId: u.id,
      email: u.email ?? "",
      fullName: profileMap.get(u.id)?.full_name ?? "",
      role: roleMap.get(u.id) ?? profileMap.get(u.id)?.role ?? "viewer",
      createdAt: u.created_at ?? null,
      lastSignInAt: u.last_sign_in_at ?? null,
    }));
  });

export const updateCollaborator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; fullName: string; role: string }) => {
    const allowed = ["admin", "controller", "viewer"];
    if (!input.userId) throw new Error("Colaborador inválido.");
    if (!allowed.includes(input.role)) throw new Error("Perfil inválido.");
    return { userId: input.userId, fullName: input.fullName.trim(), role: input.role };
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: pErr } = await supabaseAdmin
      .from("users_profiles")
      .upsert(
        { user_id: data.userId, full_name: data.fullName, role: data.role },
        { onConflict: "user_id" },
      );
    if (pErr) throw new Error(pErr.message);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role as "admin" | "controller" | "viewer" });
    if (rErr) throw new Error(rErr.message);

    return { ok: true };
  });

export const deleteCollaborator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!input.userId) throw new Error("Colaborador inválido.");
    return input;
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context as any);
    if (data.userId === (context as any).userId) {
      throw new Error("Você não pode excluir a sua própria conta.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
