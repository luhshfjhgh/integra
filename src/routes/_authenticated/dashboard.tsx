import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Thermometer, Droplets, Zap, Wifi, Cpu, AlertTriangle, Activity, Battery } from "lucide-react";
import { supabase, type Device, type Telemetry, type Alert } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { StatCard } from "@/components/StatCard";
import { TelemetryChart } from "@/components/TelemetryChart";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — IndusMon" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const uid = user!.id;

  const devicesQ = useQuery({
    queryKey: ["devices", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("dispositivos").select("*").eq("user_id", uid).order("created_at");
      if (error) throw error;
      return data as Device[];
    },
  });

  const [latest, setLatest] = useState<Telemetry | null>(null);
  const [history, setHistory] = useState<Telemetry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const { data: telemetry } = await supabase
        .from("telemetria")
        .select("*")
        .eq("user_id", uid)
        .order("timestamp", { ascending: false })
        .limit(60);
      if (mounted && telemetry) {
        setHistory(telemetry as Telemetry[]);
        setLatest((telemetry[0] as Telemetry) ?? null);
      }
      const { data: al } = await supabase
        .from("alertas")
        .select("*")
        .eq("user_id", uid)
        .eq("resolvido", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (mounted && al) setAlerts(al as Alert[]);
    }
    bootstrap();

    const ch = supabase
      .channel("realtime-dashboard-" + uid)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "telemetria", filter: `user_id=eq.${uid}` },
        (payload) => {
          const t = payload.new as Telemetry;
          setLatest(t);
          setHistory((h) => [t, ...h].slice(0, 60));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alertas", filter: `user_id=eq.${uid}` },
        (payload) => setAlerts((a) => [payload.new as Alert, ...a].slice(0, 5)),
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [uid]);

  const devices = devicesQ.data ?? [];
  const online = latest && new Date(latest.timestamp).getTime() > Date.now() - 60_000;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Visão geral</div>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {devices.length} dispositivo{devices.length === 1 ? "" : "s"} vinculados{latest && ` · última leitura ${formatDistanceToNow(new Date(latest.timestamp), { locale: ptBR, addSuffix: true })}`}
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${online ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
          {online ? "Online" : "Aguardando dados"}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Temperatura" value={latest?.temperatura?.toFixed(1) ?? "—"} unit="°C" icon={<Thermometer className="h-5 w-5" />} accent="destructive" delay={0} />
        <StatCard label="Umidade" value={latest?.umidade?.toFixed(0) ?? "—"} unit="%" icon={<Droplets className="h-5 w-5" />} accent="primary" delay={0.05} />
        <StatCard label="Energia" value={latest?.energia ? "Ativa" : latest ? "Desligada" : "—"} icon={<Zap className="h-5 w-5" />} accent={latest?.energia ? "success" : "warning"} delay={0.1} />
        <StatCard label="Gerador" value={latest?.gerador ? "Ligado" : latest ? "Desligado" : "—"} icon={<Battery className="h-5 w-5" />} accent={latest?.gerador ? "warning" : "success"} delay={0.15} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Telemetria</h2>
              <p className="text-xs text-muted-foreground">Últimas {history.length} leituras</p>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="h-72">
            {history.length > 0 ? (
              <TelemetryChart data={history} />
            ) : (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">Nenhum dado ainda</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Estado do dispositivo</h2>
            <Cpu className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <LedRow label="LED Verde" on={latest?.led_verde} color="bg-success" />
            <LedRow label="LED Amarelo" on={latest?.led_amarelo} color="bg-warning" />
            <LedRow label="LED Vermelho" on={latest?.led_vermelho} color="bg-destructive" />
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <InfoRow icon={<Wifi className="h-4 w-4" />} label="WiFi" value={latest?.wifi != null ? `${latest.wifi} dBm` : "—"} />
              <InfoRow label="IP" value={latest?.ip ?? "—"} />
              <InfoRow label="MAC" value={latest?.mac ?? "—"} mono />
              <InfoRow label="Uptime" value={latest?.uptime != null ? `${Math.floor(latest.uptime / 60)} min` : "—"} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Alertas ativos</h2>
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
        </div>
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhum alerta ativo</div>
        ) : (
          <ul className="divide-y divide-border">
            {alerts.map((a, i) => (
              <motion.li key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="py-3 flex items-start gap-3">
                <span className={`mt-1.5 h-2 w-2 rounded-full ${a.severidade === "critical" ? "bg-destructive" : a.severidade === "warning" ? "bg-warning" : "bg-primary"}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{a.titulo}</div>
                  {a.descricao && <div className="text-xs text-muted-foreground">{a.descricao}</div>}
                </div>
                <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}</div>
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function LedRow({ label, on, color }: { label: string; on: boolean | null | undefined; color: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full transition ${on ? `${color} shadow-[0_0_12px_currentColor]` : "bg-muted"}`} />
        <span className="text-xs font-medium">{on ? "ON" : "OFF"}</span>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, mono }: { icon?: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground flex items-center gap-1.5">{icon}{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}