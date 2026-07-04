import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { generateCode, sendVerificationEmail } from "@/lib/emailjs";
import { ShieldCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/verify")({
  validateSearch: z.object({ email: z.string().email() }),
  head: () => ({ meta: [{ title: "Verificar email — IndusMon" }, { name: "robots", content: "noindex" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (attempts >= 5) return toast.error("Muitas tentativas. Solicite um novo código.");
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("codigos_verificacao")
        .select("*")
        .eq("email", email)
        .eq("codigo", code)
        .gt("expires_at", new Date().toISOString())
        .eq("usado", false)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setAttempts((a) => a + 1);
        toast.error("Código inválido ou expirado");
        return;
      }
      await supabase.from("codigos_verificacao").update({ usado: true }).eq("id", data.id);
      toast.success("Email verificado! Faça login.");
      navigate({ to: "/auth", replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Erro");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    try {
      const c = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { data: userRes } = await supabase.auth.getUser();
      if (userRes.user) {
        await supabase.from("codigos_verificacao").insert({
          user_id: userRes.user.id,
          email,
          codigo: c,
          expires_at: expiresAt,
        });
      }
      await sendVerificationEmail(email, c);
      toast.success("Novo código enviado");
      setAttempts(0);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Verificação por email</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enviamos um código de 6 dígitos para <strong>{email}</strong>. Ele expira em 10 minutos.
        </p>

        <form onSubmit={onVerify} className="mt-6 space-y-4">
          <input
            inputMode="numeric"
            maxLength={6}
            pattern="\d{6}"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-center text-2xl tracking-[0.5em] font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="000000"
          />
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Verificar
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={busy}
            className="w-full text-sm text-muted-foreground hover:text-primary transition"
          >
            Reenviar código
          </button>
        </form>
      </div>
    </div>
  );
}