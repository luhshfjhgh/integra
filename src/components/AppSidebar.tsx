import { Link, useRouter } from "@tanstack/react-router";
import { LayoutDashboard, Cpu, ScrollText, AlertTriangle, Settings, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/devices", label: "Dispositivos", icon: Cpu },
  { to: "/alerts", label: "Alertas", icon: AlertTriangle },
  { to: "/logs", label: "Logs", icon: ScrollText },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function handleSignOut() {
    await signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card/50 backdrop-blur">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 grid place-items-center text-primary-foreground font-bold shadow-sm">
            IM
          </div>
          <div>
            <div className="font-semibold tracking-tight">IntegraColde</div>
            <div className="text-xs text-muted-foreground"> Monitor 24horas</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary" }}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {dark ? "Modo claro" : "Modo escuro"}
        </button>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
          <div className="h-8 w-8 rounded-full bg-primary/20 grid place-items-center text-xs font-semibold text-primary">
            {(user?.email ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user?.email}</div>
          </div>
          <button onClick={handleSignOut} className="text-muted-foreground hover:text-destructive p-1" title="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}