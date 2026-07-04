# IndusMon — Monitoramento Industrial ESP32

SaaS industrial para monitoramento em tempo real de dispositivos ESP32
usando **Supabase** (Postgres + Auth + Realtime + Edge Functions),
**React 19 + TanStack Start**, **Tailwind CSS**, **Framer Motion** e
**Chart.js**. Verificação de email via **EmailJS** (código 6 dígitos).

## 1. Configurar o Supabase

1. Acesse o SQL Editor do seu projeto Supabase e rode o arquivo
   [`supabase/schema.sql`](./supabase/schema.sql). Ele cria todas as tabelas,
   grants, RLS e ativa Realtime.
2. Deploy da Edge Function de ingestão:

   ```bash
   supabase functions deploy ingest --no-verify-jwt
   ```

   A URL final é `https://<project-ref>.functions.supabase.co/ingest`.

## 2. Configurar EmailJS

1. Crie conta em https://emailjs.com.
2. Crie um **Email Service** (Gmail, SendGrid, etc.) e anote o `SERVICE_ID`.
3. Crie um **Email Template** com duas variáveis: `{{code}}` e `{{to_email}}`.
   Anote o `TEMPLATE_ID`.
4. Copie sua **Public Key**.
5. Salve as três chaves nos secrets do projeto Lovable:
   `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`.

## 3. Firmware ESP32 (payload esperado)

POST `application/json` para a URL da Edge Function:

```json
{
  "device_id": "ESP32-001",
  "device_key": "<a chave gerada quando você criou o dispositivo no app>",
  "temperatura": 24.5, "umidade": 60, "status": "ok",
  "energia": true, "gerador": false,
  "led_verde": true, "led_amarelo": false, "led_vermelho": false,
  "botao_verde": false, "botao_amarelo": false, "botao_vermelho": false,
  "uptime": 12345, "ip": "192.168.0.10", "mac": "AA:BB:CC:DD:EE:FF",
  "wifi": -55
}
```

A Edge Function:
- Valida `device_id` + `device_key`
- Identifica o proprietário
- Insere em `telemetria`
- Cria `logs` automáticos
- Dispara `alertas` (temperatura/umidade fora de range, energia off, LED vermelho)

## 4. Fluxo de uso

1. Usuário cria conta em `/auth` → recebe código 6 dígitos por email → confirma em `/verify`.
2. Acessa `/dashboard` (protegido).
3. Vai em **Dispositivos** e cadastra seu ESP32; o app gera uma `device_key` única.
4. Configura o firmware do ESP32 com essa `device_key` e o endpoint da Edge Function.
5. Dados chegam em **tempo real** (Supabase Realtime).

## Estrutura

```
src/
├── lib/
│   ├── supabase.ts           # cliente + tipos
│   ├── auth-context.tsx      # AuthProvider
│   ├── config.functions.ts   # server fn com config pública
│   └── emailjs.ts            # envio de códigos
├── components/
│   ├── AppSidebar.tsx
│   ├── StatCard.tsx
│   └── TelemetryChart.tsx
└── routes/
    ├── auth.tsx
    ├── verify.tsx
    ├── forgot-password.tsx
    ├── reset-password.tsx
    └── _authenticated/
        ├── route.tsx
        ├── dashboard.tsx
        ├── devices.tsx
        ├── alerts.tsx
        ├── logs.tsx
        └── settings.tsx
supabase/
├── schema.sql
└── functions/ingest/index.ts
```

## Segurança

- Frontend usa **apenas** a ANON key.
- Service role fica **apenas** dentro da Edge Function do Supabase.
- RLS ativa em todas as tabelas — cada usuário só vê seus dados.
- Device key é gerada com `crypto.getRandomValues` (192 bits)."# integra"  
