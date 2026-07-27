import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock, Mail } from "lucide-react";
import somusLogo from "@/assets/somus-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { ensureDefaultUser } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acessar — BPO Controladoria" },
      { name: "description", content: "Faça login na plataforma de controladoria financeira." },
    ],
  }),
  component: LoginPage,
});

type Step = "credentials" | "otp";

function LoginPage() {
  const navigate = useNavigate();
  const seed = useServerFn(ensureDefaultUser);
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("financeiro@agenciaw2.com.br");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Ensure the default user exists on first mount + redirect if already signed in
  useEffect(() => {
    seed().catch(() => {});
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, []);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        toast.success("Bem-vindo!");
        navigate({ to: "/" });
        return;
      }
      // First access: email not confirmed → send OTP for email verification
      const msg = (error.message ?? "").toLowerCase();
      if (msg.includes("not confirmed") || msg.includes("confirm")) {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        if (otpErr) {
          toast.error(otpErr.message);
          return;
        }
        toast.success("Enviamos um código de verificação para seu e-mail.");
        setStep("otp");
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp.trim(),
        type: "email",
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Acesso confirmado!");
      navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Toaster richColors position="top-right" />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-full items-center justify-center rounded-2xl bg-white dark:bg-black px-6 py-4 border border-border transition-colors duration-200 shadow-sm">
            <img src={somusLogo.url} alt="SOMUS" className="h-10 w-auto object-contain brightness-0 dark:brightness-100" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">BPO Controladoria</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "credentials"
              ? "Entre com seu usuário e senha"
              : "Digite o código enviado ao seu e-mail"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {step === "credentials" ? (
            <form onSubmit={handleCredentials} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Usuário (e-mail)</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Código de verificação</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Digite o código recebido"
                  className="text-center text-lg tracking-[0.5em]"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enviamos um código para <strong>{email}</strong>. Verifique sua caixa de entrada e
                  spam.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar acesso"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep("credentials")}
                disabled={loading}
              >
                Voltar
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
