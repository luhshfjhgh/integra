-- ============================================================
-- IndusMon — Schema completo (rode uma vez no SQL Editor Supabase)
-- ============================================================

-- 1. DISPOSITIVOS
create table if not exists public.dispositivos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  email_proprietario text not null,
  device_id text not null,
  device_key text unique not null,
  nome text,
  empresa text,
  created_at timestamptz default now(),
  unique(user_id, device_id)
);

-- 2. TELEMETRIA
create table if not exists public.telemetria (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  temperatura numeric,
  umidade numeric,
  status text,
  energia boolean,
  gerador boolean,
  led_verde boolean,
  led_amarelo boolean,
  led_vermelho boolean,
  botao_verde boolean,
  botao_amarelo boolean,
  botao_vermelho boolean,
  uptime integer,
  ip text,
  mac text,
  wifi integer,
  timestamp timestamptz default now()
);
create index if not exists telemetria_user_time_idx on public.telemetria (user_id, timestamp desc);
create index if not exists telemetria_device_time_idx on public.telemetria (device_id, timestamp desc);

-- 3. LOGS
create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  tipo text not null default 'info',
  mensagem text not null,
  created_at timestamptz default now()
);
create index if not exists logs_user_time_idx on public.logs (user_id, created_at desc);

-- 4. ALERTAS
create table if not exists public.alertas (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  severidade text not null default 'info',
  titulo text not null,
  descricao text,
  resolvido boolean default false,
  created_at timestamptz default now()
);
create index if not exists alertas_user_time_idx on public.alertas (user_id, created_at desc);

-- 5. CONFIGURACOES
create table if not exists public.configuracoes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  temp_max numeric default 60,
  temp_min numeric default 5,
  umidade_max numeric default 90,
  umidade_min numeric default 20,
  notificar_email boolean default true,
  created_at timestamptz default now()
);

-- 6. CODIGOS DE VERIFICACAO (EmailJS 6-dígitos)
create table if not exists public.codigos_verificacao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  codigo text not null,
  expires_at timestamptz not null,
  usado boolean default false,
  created_at timestamptz default now()
);
create index if not exists codigos_email_idx on public.codigos_verificacao (email, usado);

-- ============================================================
-- GRANTS (Data API precisa)
-- ============================================================
grant select, insert, update, delete on public.dispositivos to authenticated;
grant select, insert, update, delete on public.telemetria to authenticated;
grant select, insert, update, delete on public.logs to authenticated;
grant select, insert, update, delete on public.alertas to authenticated;
grant select, insert, update, delete on public.configuracoes to authenticated;
grant select, insert, update on public.codigos_verificacao to authenticated, anon;

grant all on public.dispositivos, public.telemetria, public.logs, public.alertas,
  public.configuracoes, public.codigos_verificacao to service_role;

-- ============================================================
-- RLS
-- ============================================================
alter table public.dispositivos enable row level security;
alter table public.telemetria enable row level security;
alter table public.logs enable row level security;
alter table public.alertas enable row level security;
alter table public.configuracoes enable row level security;
alter table public.codigos_verificacao enable row level security;

-- Dispositivos: dono lê/escreve
create policy "own devices select" on public.dispositivos for select to authenticated using (auth.uid() = user_id);
create policy "own devices insert" on public.dispositivos for insert to authenticated with check (auth.uid() = user_id);
create policy "own devices update" on public.dispositivos for update to authenticated using (auth.uid() = user_id);
create policy "own devices delete" on public.dispositivos for delete to authenticated using (auth.uid() = user_id);

-- Telemetria: dono lê (edge function insere via service_role)
create policy "own telemetry select" on public.telemetria for select to authenticated using (auth.uid() = user_id);

-- Logs: dono lê
create policy "own logs select" on public.logs for select to authenticated using (auth.uid() = user_id);

-- Alertas: dono lê/marca resolvido
create policy "own alerts select" on public.alertas for select to authenticated using (auth.uid() = user_id);
create policy "own alerts update" on public.alertas for update to authenticated using (auth.uid() = user_id);

-- Configuracoes
create policy "own config all" on public.configuracoes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Codigos verificacao: anon pode ler/inserir por email durante fluxo de signup
create policy "codigos select" on public.codigos_verificacao for select to anon, authenticated using (true);
create policy "codigos insert" on public.codigos_verificacao for insert to anon, authenticated with check (true);
create policy "codigos update" on public.codigos_verificacao for update to anon, authenticated using (true);

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.telemetria;
alter publication supabase_realtime add table public.alertas;
alter publication supabase_realtime add table public.logs;