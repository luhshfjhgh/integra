// ============================================================
// Edge Function: ingest (ESP32 -> Supabase)
// Deploy: supabase functions deploy ingest --no-verify-jwt
// URL: https://<project>.functions.supabase.co/ingest
// ============================================================
//
// A ESP32 faz POST JSON:
// {
//   "device_id": "ESP32-001",
//   "device_key": "hex...",
//   "temperatura": 24.5,
//   "umidade": 60,
//   "status": "ok",
//   "energia": true,
//   "gerador": false,
//   "led_verde": true, "led_amarelo": false, "led_vermelho": false,
//   "botao_verde": false, "botao_amarelo": false, "botao_vermelho": false,
//   "uptime": 12345,
//   "ip": "192.168.0.10",
//   "mac": "AA:BB:CC:DD:EE:FF",
//   "wifi": -55
// }

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const { device_id, device_key } = body ?? {};
  if (!device_id || !device_key) return json({ error: "missing_credentials" }, 400);

  const { data: device, error: dErr } = await supabase
    .from("dispositivos")
    .select("id, user_id, device_id")
    .eq("device_id", device_id)
    .eq("device_key", device_key)
    .maybeSingle();

  if (dErr) return json({ error: dErr.message }, 500);
  if (!device) return json({ error: "invalid_device" }, 401);

  const uid = device.user_id;

  const telemetry = {
    device_id,
    user_id: uid,
    temperatura: num(body.temperatura),
    umidade: num(body.umidade),
    status: body.status ?? null,
    energia: bool(body.energia),
    gerador: bool(body.gerador),
    led_verde: bool(body.led_verde),
    led_amarelo: bool(body.led_amarelo),
    led_vermelho: bool(body.led_vermelho),
    botao_verde: bool(body.botao_verde),
    botao_amarelo: bool(body.botao_amarelo),
    botao_vermelho: bool(body.botao_vermelho),
    uptime: num(body.uptime),
    ip: body.ip ?? null,
    mac: body.mac ?? null,
    wifi: num(body.wifi),
    timestamp: body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString(),
  };

  const { error: tErr } = await supabase.from("telemetria").insert(telemetry);
  if (tErr) return json({ error: tErr.message }, 500);

  // logs / alertas automáticos
  const alerts: any[] = [];
  const logs: any[] = [{ device_id, user_id: uid, tipo: "info", mensagem: `Leitura recebida (T=${telemetry.temperatura}°C, U=${telemetry.umidade}%)` }];

  const { data: cfg } = await supabase.from("configuracoes").select("*").eq("user_id", uid).maybeSingle();
  const tmax = cfg?.temp_max ?? 60;
  const tmin = cfg?.temp_min ?? 5;
  const umax = cfg?.umidade_max ?? 90;
  const umin = cfg?.umidade_min ?? 20;

  if (telemetry.temperatura != null && telemetry.temperatura > tmax)
    alerts.push({ device_id, user_id: uid, severidade: "critical", titulo: "Temperatura alta", descricao: `${telemetry.temperatura}°C excede ${tmax}°C` });
  if (telemetry.temperatura != null && telemetry.temperatura < tmin)
    alerts.push({ device_id, user_id: uid, severidade: "warning", titulo: "Temperatura baixa", descricao: `${telemetry.temperatura}°C abaixo de ${tmin}°C` });
  if (telemetry.umidade != null && (telemetry.umidade > umax || telemetry.umidade < umin))
    alerts.push({ device_id, user_id: uid, severidade: "warning", titulo: "Umidade fora do range", descricao: `${telemetry.umidade}%` });
  if (telemetry.energia === false)
    alerts.push({ device_id, user_id: uid, severidade: "critical", titulo: "Energia desligada", descricao: "Rede elétrica caiu" });
  if (telemetry.led_vermelho === true)
    alerts.push({ device_id, user_id: uid, severidade: "critical", titulo: "LED vermelho ativado", descricao: "Estado de emergência" });

  await supabase.from("logs").insert(logs);
  if (alerts.length) await supabase.from("alertas").insert(alerts);

  return json({ ok: true, alerts: alerts.length });
});

function num(v: any) { return v == null || v === "" ? null : Number(v); }
function bool(v: any) { if (v === true || v === "true" || v === 1 || v === "1") return true; if (v === false || v === "false" || v === 0 || v === "0") return false; return null; }
function json(o: any, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...cors, "content-type": "application/json" } });
}