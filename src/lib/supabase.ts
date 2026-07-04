import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram encontradas."
  );
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export type Device = {
  id: string;
  device_id: string;
  device_key: string;
  nome: string | null;
  empresa: string | null;
  email_proprietario: string;
  user_id: string;
  created_at: string;
};

export type Telemetry = {
  id: string;
  device_id: string;
  user_id: string;
  temperatura: number | null;
  umidade: number | null;
  status: string | null;
  energia: boolean | null;
  gerador: boolean | null;
  led_verde: boolean | null;
  led_amarelo: boolean | null;
  led_vermelho: boolean | null;
  botao_verde: boolean | null;
  botao_amarelo: boolean | null;
  botao_vermelho: boolean | null;
  uptime: number | null;
  ip: string | null;
  mac: string | null;
  wifi: number | null;
  timestamp: string;
};

export type LogEntry = {
  id: string;
  device_id: string;
  user_id: string;
  tipo: string;
  mensagem: string;
  created_at: string;
};

export type Alert = {
  id: string;
  device_id: string;
  user_id: string;
  severidade: "info" | "warning" | "critical";
  titulo: string;
  descricao: string | null;
  resolvido: boolean;
  created_at: string;
};