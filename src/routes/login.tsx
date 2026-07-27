import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  Mail,
  PieChart,
  QrCode,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import somusLogo from "@/assets/somus-logo.png.asset.json";
import loginHero from "@/assets/login-hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { ensureDefaultUser } from "@/lib/auth.functions";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acessar — BPO Controladoria SOMUS" },
      {
        name: "description",
        content:
          "Acesse o BPO Controladoria da SOMUS: indicadores, análises e controle total do seu negócio.",
      },
      { property: "og:title", content: "Acessar — BPO Controladoria SOMUS" },
      {
        property: "og:description",
        content: "Gestão inteligente, decisões que constroem resultados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

type Tab = "login" | "code";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Segurança e confiabilidade",
    text: "Informações claras e com criptografia avançada.",
  },
  {
    icon: PieChart,
    title: "Análises completas",
    text: "Visão 360º do desempenho do seu negócio.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança avançada",
    text: "Proteção de dados com criptografia de ponta.",
  },
  {
    icon: FileText,
    title: "Controle total",
    text: "Organização e controle em um só lugar.",
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const seed = useServerFn(ensureDefaultUser);
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("financeiro@agenciaw2.com.br");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

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
        setTab("code");
        setOtpSent(true);
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Código enviado para seu e-mail.");
      setOtpSent(true);
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

  async function handleForgot() {
    if (!email) {
      toast.error("Informe seu e-mail primeiro.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Enviamos as instruções para seu e-mail.");
  }

  const fieldClass =
    "h-12 w-full rounded-lg border border-[#1e2d42] bg-[#0d1826] pl-11 pr-11 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#22a7f0] focus:ring-2 focus:ring-[#22a7f0]/25";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050a12] text-slate-200">
      <Toaster richColors position="top-right" />

      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        {/* ---------- Left / brand + hero ---------- */}
        <div className="relative flex flex-col justify-between overflow-hidden px-8 pt-10 lg:px-14">
          <div className="relative z-10">
            <img src={somusLogo.url} alt="SOMUS" className="h-9 w-auto object-contain" />
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#22a7f0]">
              BPO Controladoria
            </p>

            <h1 className="mt-10 max-w-md text-3xl font-semibold leading-tight text-white lg:text-[34px]">
              Gestão inteligente,
              <br />
              decisões que constroem
              <br />
              <span className="text-[#22a7f0]">resultados.</span>
            </h1>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-slate-400">
              Acompanhe indicadores, analise cenários e tenha o controle total do seu negócio.
            </p>
          </div>

          <div className="pointer-events-none relative z-0 -mx-8 mt-8 lg:-mx-14">
            <img
              src={loginHero}
              alt="Painel financeiro holográfico com gráficos"
              width={1200}
              height={1408}
              className="h-[420px] w-full object-cover object-center opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050a12] via-transparent to-[#050a12]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050a12]/60 via-transparent to-[#050a12]" />
          </div>
        </div>

        {/* ---------- Right / auth card ---------- */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-[420px] rounded-2xl border border-[#16263c] bg-[#0a1420]/90 p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur">
            <div className="flex flex-col items-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#22a7f0]/50 bg-[#0d1c2e] shadow-[0_0_35px_rgba(34,167,240,0.45)]">
                <span className="absolute inset-2 rounded-full border border-[#22a7f0]/30" />
                <span className="text-3xl font-semibold text-[#22a7f0]">$</span>
              </div>
              <p className="mt-5 text-lg font-medium text-[#22a7f0]">BPO</p>
              <h2 className="text-3xl font-semibold tracking-tight text-white">Controladoria</h2>
              <p className="mt-2 text-sm text-slate-400">
                Acesse sua conta para <span className="text-[#22a7f0]">continuar</span>
              </p>
            </div>

            {/* Tabs */}
            <div className="mt-7 grid grid-cols-2 border-b border-[#16263c] text-sm">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`flex items-center justify-center gap-2 pb-3 transition ${
                  tab === "login"
                    ? "border-b-2 border-[#22a7f0] font-medium text-[#22a7f0]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserRound className="h-4 w-4" /> Login
              </button>
              <button
                type="button"
                onClick={() => setTab("code")}
                className={`flex items-center justify-center gap-2 pb-3 transition ${
                  tab === "code"
                    ? "border-b-2 border-[#22a7f0] font-medium text-[#22a7f0]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <QrCode className="h-4 w-4" /> Acesso por código
              </button>
            </div>

            {tab === "login" ? (
              <form onSubmit={handleCredentials} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm text-slate-300">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Digite seu e-mail"
                      autoComplete="email"
                      required
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm text-slate-300">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      required
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex cursor-pointer items-center gap-2 text-slate-400">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-[#22405f] bg-[#0d1826] accent-[#22a7f0]"
                    />
                    Lembrar meu acesso
                  </label>
                  <button
                    type="button"
                    onClick={handleForgot}
                    className="text-[#22a7f0] transition hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-[#1e88e5] to-[#22c9f0] font-medium text-white shadow-[0_10px_30px_-10px_rgba(34,167,240,0.8)] transition hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={otpSent ? handleOtp : sendCode} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email-code" className="text-sm text-slate-300">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="email-code"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Digite seu e-mail"
                      autoComplete="email"
                      required
                      className={fieldClass}
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-2">
                    <label htmlFor="otp" className="text-sm text-slate-300">
                      Código de verificação
                    </label>
                    <input
                      id="otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      required
                      className="h-12 w-full rounded-lg border border-[#1e2d42] bg-[#0d1826] px-4 text-center text-lg tracking-[0.5em] text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#22a7f0] focus:ring-2 focus:ring-[#22a7f0]/25"
                    />
                    <p className="text-xs text-slate-500">
                      Enviamos um código para <strong className="text-slate-300">{email}</strong>.
                      Verifique a caixa de entrada e o spam.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-[#1e88e5] to-[#22c9f0] font-medium text-white shadow-[0_10px_30px_-10px_rgba(34,167,240,0.8)] transition hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {otpSent ? "Confirmar acesso" : "Enviar código"}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 flex items-center gap-4">
              <span className="h-px flex-1 bg-[#16263c]" />
              <span className="text-[11px] tracking-[0.45em] text-slate-500">SOMUS</span>
              <span className="h-px flex-1 bg-[#16263c]" />
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Feature strip ---------- */}
      <div className="border-t border-[#101d2e] bg-[#050a12]">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-8 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-14">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#16263c] bg-[#0a1420] text-[#22a7f0]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
