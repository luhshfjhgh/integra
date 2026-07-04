import emailjs from "@emailjs/browser";
import { getPublicConfig } from "./config.functions";

let cached: { serviceId: string; templateId: string; publicKey: string } | null = null;

async function ensureConfig() {
  if (cached && cached.publicKey) return cached;
  const cfg = await getPublicConfig();
  cached = cfg.emailjs;
  if (cached.publicKey) emailjs.init({ publicKey: cached.publicKey });
  return cached;
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(toEmail: string, code: string) {
  const cfg = await ensureConfig();
  if (!cfg.serviceId || !cfg.templateId || !cfg.publicKey) {
    throw new Error("EmailJS não configurado. Verifique EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY.");
  }
  return emailjs.send(
    cfg.serviceId,
    cfg.templateId,
    { to_email: toEmail, code, email: toEmail },
    { publicKey: cfg.publicKey },
  );
}