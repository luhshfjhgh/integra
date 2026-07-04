import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { generateCode, sendVerificationEmail } from "@/lib/emailjs";
import { Activity, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — IndusMon" },
      { name: "description", content: "Acesse sua conta IndusMon." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login realizado");
        navigate({ to: "/dashboard", replace: true });
      } else {
        // Sign up + send verification code via EmailJS
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        const code = generateCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const userId = data.user?.id;
        if (userId) {
          await supabase.from("codigos_verificacao").insert({
            user_id: userId,
            email,
            codigo: code,
            expires_at: expiresAt,
          });
        }
        try {
          await sendVerificationEmail(email, code);
          toast.success("Código enviado para seu email");
        } catch (err: any) {
          toast.error("Cadastro criado, mas falha ao enviar email: " + err.message);
        }
        navigate({ to: "/verify", search: { email } });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro na autenticação");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative flex items-center gap-2 font-semibold">
          <Activity className="h-6 w-6" />
          IndusMon
        </div>
        <div className="relative space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">
            Monitore sua planta industrial em tempo real.
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Telemetria ESP32, alertas automáticos, logs e insights — tudo em um painel moderno e seguro.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6 max-w-md">
            {[
              { k: "<200ms", v: "Latência realtime" },
              { k: "99.9%", v: "Uptime" },
              { k: "AES-256", v: "Criptografia" },
            ].map((s) => (
              <div key={s.v} className="rounded-lg bg-white/10 backdrop-blur p-3">
                <div className="text-2xl font-semibold">{s.k}</div>
                <div className="text-xs text-primary-foreground/70">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-primary-foreground/60">© {new Date().getFullYear()} IndusMon</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 font-semibold">
            <Activity className="h-5 w-5 text-primary" /> IndusMon
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {tab === "login" ? "Bem-vindo de volta" : "Criar conta"}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {tab === "login" ? "Acesse seu painel industrial" : "Comece a monitorar em minutos"}
          </p>

          <div className="mt-6 flex gap-1 p-1 bg-muted rounded-lg w-full">
            <button onClick={() => setTab("login")} className={`flex-1 py-2 text-sm font-medium rounded-md transition ${tab === "login" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Entrar</button>
            <button onClick={() => setTab("signup")} className={`flex-1 py-2 text-sm font-medium rounded-md transition ${tab === "signup" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Criar conta</button>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="voce@empresa.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Senha</label>
                {tab === "login" && (
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">Esqueci</Link>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {tab === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}