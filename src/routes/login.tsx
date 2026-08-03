import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import somusLogo from "@/assets/somus-logo-white.png.asset.json";
import loginHero from "@/assets/login-hero.jpg";
import coinAsset from "@/assets/coin-clean.png.asset.json";
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
        content: "Inteligência que transforma gestão em resultados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

type Tab = "login" | "code" | "signup";

function LoginPage() {
  const navigate = useNavigate();
  const seed = useServerFn(ensureDefaultUser);
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [inviteValid, setInviteValid] = useState(false);

  useEffect(() => {
    seed().catch(() => {});
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
    const token = new URLSearchParams(window.location.search).get("convite")?.trim() ?? "";
    if (!token) return;
    setInviteToken(token);
    supabase.rpc("invite_is_valid", { _token: token }).then(({ data, error }) => {
      if (error || data !== true) {
        toast.error("Este link de convite é inválido, já foi usado ou expirou.");
        return;
      }
      setInviteValid(true);
      setTab("signup");
    });
  }, []);


  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      toast.error("Informe e-mail e senha.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (!error) {
        toast.success("Bem-vindo!");
        navigate({ to: "/" });
        return;
      }
      const msg = (error.message ?? "").toLowerCase();
      if (msg.includes("not confirmed") || msg.includes("confirm")) {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: false },
        });
        if (otpErr) {
          toast.error(otpErr.message);
          return;
        }
        toast.success("Enviamos um código de verificação para seu e-mail.");
        setTab("code");
        setOtpSent(true);
      } else if (msg.includes("invalid login credentials")) {
        toast.error("E-mail ou senha incorretos. Confira o e-mail usado no cadastro.");
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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteValid || !inviteToken) {
      toast.error("O cadastro é permitido somente por link de convite válido.");
      return;
    }
    if (signupPassword.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: {
          data: { full_name: fullName.trim(), invite_token: inviteToken },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }
      if (data.session) {
        toast.success("Conta criada! Acesso master admin liberado.");
        navigate({ to: "/" });
        return;
      }
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: signupEmail.trim(),
        password: signupPassword,
      });
      if (signInErr) {
        toast.success("Conta criada! Faça login para continuar.");
        setEmail(signupEmail.trim());
        setTab("login");
        return;
      }
      toast.success("Conta criada! Acesso master admin liberado.");
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
    "h-12 w-full rounded-xl border border-[#1b2c42] bg-[#0b1725] pl-12 pr-11 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#2f8ef4] focus:ring-2 focus:ring-[#2f8ef4]/25";

  const submitBtn =
    "group mt-2 flex h-12 w-full items-center justify-between rounded-xl bg-gradient-to-r from-[#0b63d6] to-[#2b9bf6] px-5 text-sm font-semibold text-white shadow-[0_18px_40px_-14px_rgba(43,155,246,0.9)] transition hover:brightness-110 disabled:opacity-60";

  return (
    <div className="relative min-h-screen bg-[#04080f] text-slate-200">
      <Toaster richColors position="top-right" />

      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
        {/* ---------- Left: full-bleed hero ---------- */}
        <div className="relative min-h-[420px] overflow-hidden">
          <img
            src={loginHero}
            alt="Painel financeiro holográfico com gráficos"
            width={1200}
            height={1408}
            className="absolute inset-0 h-full w-full scale-[1.08] object-cover brightness-[1.35] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#04080f]/70 via-transparent to-[#04080f]/85" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#04080f]/80 via-transparent to-[#04080f]/45" />

          <div className="relative z-10 px-10 pt-12 lg:px-16 lg:pt-14">
            <img src={somusLogo.url} alt="SOMUS" className="h-8 w-auto object-contain lg:h-10" />

            <h1 className="mt-14 max-w-lg text-[38px] font-normal leading-[1.15] text-white lg:text-[44px]">
              Inteligência que
              <br />
              transforma gestão
              <br />
              em <span className="text-[#3b9df6]">resultados.</span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-300">
              Acompanhe indicadores, analise cenários
              <br />e tome decisões com segurança e precisão.
            </p>
            <span className="mt-6 block h-[3px] w-12 rounded-full bg-[#3b9df6]" />
          </div>
        </div>

        {/* ---------- Right: auth card ---------- */}
        <div className="flex items-center justify-center px-6 py-10 lg:px-10">
          <div className="w-full max-w-[430px] rounded-3xl border border-[#152437] bg-[#070f1a]/95 px-8 py-9 shadow-[0_40px_100px_-30px_rgba(0,0,0,1)] backdrop-blur">
            <div className="flex flex-col items-center text-center">
              <img
                src={coinAsset.url}
                alt="Ícone financeiro"
                width={340}
                height={198}
                className="h-auto w-72 object-contain drop-shadow-[0_18px_40px_rgba(59,157,246,0.35)]"
              />

              <h2 className="mt-4 text-xl font-medium leading-tight text-white">
                <span className="text-[#3b9df6]">BPO</span> Controladoria
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Acesse sua conta para <span className="text-[#3b9df6]">continuar</span>
              </p>

            </div>




            {tab === "login" ? (
              <form onSubmit={handleCredentials} className="mt-7 space-y-5">
                <div className="space-y-2.5">
                  <label htmlFor="email" className="text-sm text-slate-200">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#3b9df6]" />
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

                <div className="space-y-2.5">
                  <label htmlFor="password" className="text-sm text-slate-200">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#3b9df6]" />
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-sm">
                  <label className="flex cursor-pointer items-center gap-2.5 text-slate-300">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-[18px] w-[18px] rounded border-[#22405f] bg-[#0b1725] accent-[#3b9df6]"
                    />
                    Lembrar meu acesso
                  </label>
                  <button
                    type="button"
                    onClick={handleForgot}
                    className="text-[#3b9df6] transition hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <button type="submit" disabled={loading} className={submitBtn}>
                  {loading ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span className="flex-1 text-center">Entrar</span>
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            ) : tab === "code" ? (
              <form onSubmit={otpSent ? handleOtp : sendCode} className="mt-7 space-y-5">
                <div className="space-y-2.5">
                  <label htmlFor="email-code" className="text-sm text-slate-200">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#3b9df6]" />
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
                  <div className="space-y-2.5">
                    <label htmlFor="otp" className="text-sm text-slate-200">
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
                      className="h-14 w-full rounded-xl border border-[#1b2c42] bg-[#0b1725] px-4 text-center text-lg tracking-[0.5em] text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#2f8ef4] focus:ring-2 focus:ring-[#2f8ef4]/25"
                    />
                    <p className="text-xs text-slate-500">
                      Enviamos um código para <strong className="text-slate-300">{email}</strong>.
                      Verifique a caixa de entrada e o spam.
                    </p>
                  </div>
                )}

                <button type="submit" disabled={loading} className={submitBtn}>
                  {loading ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span className="flex-1 text-center">
                        {otpSent ? "Confirmar acesso" : "Enviar código"}
                      </span>
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="mt-7 space-y-5">
                <div className="space-y-2.5">
                  <label htmlFor="full-name" className="text-sm text-slate-200">
                    Nome completo
                  </label>
                  <div className="relative">
                    <UserPlus className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#3b9df6]" />
                    <input
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      autoComplete="name"
                      required
                      maxLength={120}
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="signup-email" className="text-sm text-slate-200">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#3b9df6]" />
                    <input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="Digite seu e-mail"
                      autoComplete="email"
                      required
                      maxLength={255}
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="signup-password" className="text-sm text-slate-200">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#3b9df6]" />
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Mínimo de 8 caracteres"
                      autoComplete="new-password"
                      required
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="signup-confirm" className="text-sm text-slate-200">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#3b9df6]" />
                    <input
                      id="signup-confirm"
                      type={showPassword ? "text" : "password"}
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      placeholder="Repita a senha"
                      autoComplete="new-password"
                      required
                      className={fieldClass}
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Cadastro autorizado por convite. A conta criada recebe perfil{" "}
                  <strong className="text-[#3b9df6]">master admin</strong>, com acesso completo ao painel.
                </p>

                <button type="submit" disabled={loading} className={submitBtn}>
                  {loading ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span className="flex-1 text-center">Criar conta e acessar</span>
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-slate-400">
              {tab === "signup" ? (
                <>
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("login")}
                    className="font-medium text-[#3b9df6] transition hover:underline"
                  >
                    Entrar
                  </button>
                </>
              ) : inviteValid ? (
                <>
                  Convite validado.{" "}
                  <button
                    type="button"
                    onClick={() => setTab("signup")}
                    className="font-medium text-[#3b9df6] transition hover:underline"
                  >
                    Criar conta
                  </button>
                </>
              ) : (
                <span className="text-slate-500">
                  Acesso restrito. Novas contas somente por link de convite.
                </span>
              )}
            </p>


            <div className="mt-9 flex items-center gap-5">
              <span className="h-px flex-1 bg-[#152437]" />
              <span className="text-[13px] tracking-[0.5em] text-slate-400">SOMUS</span>
              <span className="h-px flex-1 bg-[#152437]" />
            </div>

            <p className="mt-6 flex items-start justify-center gap-2 text-center text-[13px] leading-relaxed text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#3b9df6]" />
              <span>
                Seus dados estão protegidos com
                <br />
                tecnologia de ponta e criptografia avançada.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
