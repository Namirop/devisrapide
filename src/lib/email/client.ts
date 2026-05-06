import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (_resend) return _resend;
  _resend = new Resend(key);
  return _resend;
}

export function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
}
