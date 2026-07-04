import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type Alert } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({ meta: [{ title: "Alertas — IndusMon" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["alerts-all", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("alertas").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as Alert[];
    },
  });

  async function resolve(id: string) {
    const { error } = await supabase.from("alertas").update({ resolvido: true }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["alerts-all", uid] });
    toast.success("Alerta resolvido");
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Alertas</h1>
        <p className="text-sm text-muted-foreground mt-1">Eventos que requerem atenção</p>
      </header>
      <div className="space-y-3">
        {(q.data ?? []).length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground" />
            <div className="mt-3 text-sm text-muted-foreground">Nenhum alerta</div>
          </div>
        ) : (
          q.data!.map((a) => (
            <div key={a.id} className={`rounded-xl border p-4 flex items-start gap-4 ${a.resolvido ? "border-border bg-card opacity-60" : "border-border bg-card"}`}>
              <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${a.severidade === "critical" ? "bg-destructive/10 text-destructive" : a.severidade === "warning" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.titulo}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted uppercase">{a.severidade}</span>
                </div>
                {a.descricao && <p className="text-sm text-muted-foreground mt-1">{a.descricao}</p>}
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })} · {a.device_id.slice(0, 8)}
                </div>
              </div>
              {!a.resolvido && (
                <button onClick={() => resolve(a.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted">
                  <Check className="h-3.5 w-3.5" /> Resolver
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}