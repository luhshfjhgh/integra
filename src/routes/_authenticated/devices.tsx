import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Cpu, Trash2, Copy, Loader2 } from "lucide-react";
import { supabase, type Device } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/devices")({
  head: () => ({ meta: [{ title: "Dispositivos — IndusMon" }] }),
  component: DevicesPage,
});

function randomKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function DevicesPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ device_id: "", nome: "", empresa: "" });

  const q = useQuery({
    queryKey: ["devices", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("dispositivos").select("*").eq("user_id", uid).order("created_at");
      if (error) throw error;
      return data as Device[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const device_key = randomKey();
      const { error } = await supabase.from("dispositivos").insert({
        user_id: uid,
        email_proprietario: user!.email,
        device_id: form.device_id,
        device_key,
        nome: form.nome,
        empresa: form.empresa,
      });
      if (error) throw error;
      return device_key;
    },
    onSuccess: (key) => {
      qc.invalidateQueries({ queryKey: ["devices", uid] });
      setOpen(false);
      setForm({ device_id: "", nome: "", empresa: "" });
      toast.success("Dispositivo criado");
      navigator.clipboard.writeText(key).catch(() => {});
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dispositivos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["devices", uid] });
      toast.success("Dispositivo removido");
    },
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dispositivos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus ESP32</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Novo
        </button>
      </header>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {q.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : (q.data ?? []).length === 0 ? (
          <div className="p-12 text-center">
            <Cpu className="h-10 w-10 mx-auto text-muted-foreground" />
            <div className="mt-3 font-medium">Nenhum dispositivo</div>
            <p className="text-sm text-muted-foreground mt-1">Adicione seu primeiro ESP32 para começar</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Device ID</th>
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Empresa</th>
                <th className="text-left px-4 py-3 font-medium">Device Key</th>
                <th className="w-16 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {q.data!.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{d.device_id}</td>
                  <td className="px-4 py-3">{d.nome ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.empresa ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">{d.device_key.slice(0, 12)}…</code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(d.device_key); toast.success("Copiado"); }}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => del.mutate(d.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Novo dispositivo</h2>
            <p className="text-sm text-muted-foreground">Uma device_key única será gerada.</p>
            <div className="mt-4 space-y-3">
              <Field label="Device ID" value={form.device_id} onChange={(v) => setForm({ ...form, device_id: v })} placeholder="ESP32-001" />
              <Field label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} placeholder="Sensor sala 1" />
              <Field label="Empresa" value={form.empresa} onChange={(v) => setForm({ ...form, empresa: v })} placeholder="Acme Corp" />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm hover:bg-muted">Cancelar</button>
              <button
                disabled={!form.device_id || create.isPending}
                onClick={() => create.mutate()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-60"
              >
                {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}