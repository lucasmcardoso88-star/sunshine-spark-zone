import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/common/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Link2, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

type Invite = {
  id: string;
  token: string;
  email: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

function inviteUrl(token: string) {
  return `${window.location.origin}/login?convite=${token}`;
}

function newToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function InviteManager() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [days, setDays] = useState("7");
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("convites")
      .select("id, token, email, expires_at, used_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return;
    setInvites((data ?? []) as Invite[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function createInvite() {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }
      const validDays = Math.min(Math.max(Number(days) || 7, 1), 90);
      const token = newToken();
      const { error } = await supabase.from("convites").insert({
        token,
        email: email.trim() ? email.trim().toLowerCase() : null,
        created_by: userId,
        expires_at: new Date(Date.now() + validDays * 86400000).toISOString(),
      });
      if (error) {
        toast.error("Não foi possível gerar o convite. Verifique se você é admin.");
        return;
      }
      await navigator.clipboard.writeText(inviteUrl(token)).catch(() => {});
      toast.success("Link de convite gerado e copiado!");
      setEmail("");
      load();
    } finally {
      setLoading(false);
    }
  }

  async function copy(token: string) {
    await navigator.clipboard.writeText(inviteUrl(token));
    toast.success("Link copiado.");
  }

  return (
    <Card className="p-6 rounded-2xl shadow-sm border-border/60 lg:col-span-2">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserPlus className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Convites de acesso</h3>
          <p className="text-xs text-muted-foreground">
            Gere um link exclusivo. Somente quem receber o link consegue criar conta.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_130px_auto] sm:items-end">
        <div className="space-y-1">
          <Label>E-mail (opcional — restringe o convite)</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pessoa@empresa.com.br"
          />
        </div>
        <div className="space-y-1">
          <Label>Validade (dias)</Label>
          <Input
            type="number"
            min={1}
            max={90}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
        <Button onClick={createInvite} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Gerar link
        </Button>
      </div>

      <ul className="mt-5 space-y-2 text-sm">
        {invites.length === 0 ? (
          <li className="rounded-xl border border-border/60 px-3 py-3 text-xs text-muted-foreground">
            Nenhum convite gerado ainda.
          </li>
        ) : (
          invites.map((inv) => {
            const expired = new Date(inv.expires_at).getTime() < Date.now();
            return (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{inv.email ?? "Convite aberto"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Expira em {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {inv.used_at ? (
                    <StatusBadge tone="neutral">Utilizado</StatusBadge>
                  ) : expired ? (
                    <StatusBadge tone="critical">Expirado</StatusBadge>
                  ) : (
                    <StatusBadge tone="positive">Ativo</StatusBadge>
                  )}
                  {!inv.used_at && !expired ? (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => copy(inv.token)}>
                      <Copy className="h-3.5 w-3.5" /> Copiar link
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </Card>
  );
}
