import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase, type LogEntry } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/logs")({
  head: () => ({ meta: [{ title: "Logs — IndusMon" }] }),
  component: LogsPage,
});

function LogsPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const q = useQuery({
    queryKey: ["logs", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("logs").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as LogEntry[];
    },
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">Eventos recentes dos seus dispositivos</p>
      </header>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {(q.data ?? []).length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="h-10 w-10 mx-auto text-muted-foreground" />
            <div className="mt-3 text-sm text-muted-foreground">Nenhum log</div>
          </div>
        ) : (
          <ul className="divide-y divide-border font-mono text-xs">
            {q.data!.map((l) => (
              <li key={l.id} className="px-4 py-2.5 flex gap-3">
                <span className="text-muted-foreground shrink-0">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                <span className={`shrink-0 px-1.5 rounded ${l.tipo === "error" ? "bg-destructive/10 text-destructive" : l.tipo === "warning" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>{l.tipo}</span>
                <span className="text-muted-foreground shrink-0">{l.device_id.slice(0, 8)}</span>
                <span className="flex-1">{l.mensagem}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}