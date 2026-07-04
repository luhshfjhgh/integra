import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — IndusMon" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Sua conta e preferências</p>
      </header>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/15 text-primary grid place-items-center">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="font-medium">{user?.email}</div>
            <div className="text-xs text-muted-foreground">ID: {user?.id}</div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Personalizações adicionais em breve (webhooks, notificações, thresholds de alerta).
      </div>
    </div>
  );
}