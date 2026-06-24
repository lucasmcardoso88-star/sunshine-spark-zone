import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/common/StatusBadge";
import { COMPANIES } from "@/data/mock";
import { Building2, Link2, Target, Bell, Mail, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Controladoria Agência" },
      { name: "description", content: "Empresas, integrações, metas, regras de alerta e usuários." },
    ],
  }),
  component: ConfiguracoesPage,
});

function Section({ icon: Icon, title, description, children }: {
  icon: React.ElementType; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <Card className="p-6 rounded-2xl shadow-sm border-border/60">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children}
    </Card>
  );
}

function ConfiguracoesPage() {
  return (
    <>
      <PageHeader title="Configurações" description="Gestão de empresas, integrações, orçamento e alertas." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section icon={Building2} title="Empresas" description="Unidades operacionais e CNPJ.">
          <ul className="space-y-2 text-sm">
            {COMPANIES.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">CNPJ a configurar</p></div>
                <StatusBadge tone="positive">Ativa</StatusBadge>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Link2} title="Integração Conta Azul" description="Mockada nesta etapa. Sem credenciais no frontend.">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
              <p>Status da conexão</p><StatusBadge tone="warning">Desconectado</StatusBadge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
              <p>Última sincronização</p><span className="text-muted-foreground">—</span>
            </div>
            <Button variant="outline" className="w-full"
              onClick={() => toast.info("Conexão real será implementada via Edge Function no próximo passo.")}>
              Conectar Conta Azul
            </Button>
            <p className="text-xs text-muted-foreground">Tokens de OAuth serão trocados e armazenados criptografados, jamais expostos ao navegador.</p>
          </div>
        </Section>

        <Section icon={Target} title="Metas e orçamento" description="Defina metas mensais por categoria.">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1"><Label>Meta de receita mensal</Label><Input defaultValue="R$ 290.000" /></div>
            <div className="space-y-1"><Label>Orçamento de mídia paga</Label><Input defaultValue="R$ 35.000" /></div>
            <div className="space-y-1"><Label>Margem líquida mínima</Label><Input defaultValue="15%" /></div>
            <div className="space-y-1"><Label>Reserva mínima de caixa</Label><Input defaultValue="R$ 120.000" /></div>
          </div>
        </Section>

        <Section icon={Bell} title="Regras de alerta" description="Disparo automático com base em métricas.">
          <ul className="space-y-3 text-sm">
            {[
              "Receita abaixo da meta",
              "Despesa acima do orçamento",
              "Margem líquida abaixo do mínimo",
              "Caixa projetado negativo (30 dias)",
            ].map((r) => (
              <li key={r} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                <span>{r}</span><Switch defaultChecked />
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Mail} title="Relatórios por e-mail" description="Resumo diário para o Claude Cowork.">
          <div className="space-y-3 text-sm">
            <div className="space-y-1"><Label>Destinatário</Label><Input defaultValue="controladoria@agencia.com.br" /></div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
              <span>Envio diário às 08:00</span><Switch defaultChecked />
            </div>
            <p className="text-xs text-muted-foreground">Envio real será implementado via Edge Function.</p>
          </div>
        </Section>

        <Section icon={Users} title="Usuários e permissões" description="Papéis: admin, controller, viewer.">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
              <div><p className="font-medium">Diretor financeiro</p><p className="text-xs text-muted-foreground">admin@agencia.com.br</p></div>
              <StatusBadge tone="info"><ShieldCheck className="h-3 w-3" /> Admin</StatusBadge>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
              <div><p className="font-medium">Controladoria</p><p className="text-xs text-muted-foreground">controller@agencia.com.br</p></div>
              <StatusBadge tone="info">Controller</StatusBadge>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
              <div><p className="font-medium">Sócios</p><p className="text-xs text-muted-foreground">socios@agencia.com.br</p></div>
              <StatusBadge tone="neutral">Viewer</StatusBadge>
            </li>
          </ul>
        </Section>
      </div>
    </>
  );
}