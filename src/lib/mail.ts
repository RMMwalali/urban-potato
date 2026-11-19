import "server-only";
import nodemailer from "nodemailer";
import { getCredential } from "./platform";

/**
 * Plain-text email through any SMTP service, configured in Admin → Platform → Connections (or the server
 * environment). With Gmail: host smtp.gmail.com, port 465, the Gmail address as user, and a Google
 * "app password" (Google account → Security → 2-Step Verification → App passwords) as password.
 */
export async function mailConfig() {
  const [host, port, user, pass, from] = await Promise.all(["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"].map(getCredential));
  if (!user || !pass) return null;
  const p = Number(port) || 465;
  return { host: host || "smtp.gmail.com", port: p, secure: p === 465, auth: { user, pass }, from: from || `Darling HQ <${user}>` };
}

const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

export async function sendMail(m: { to: string; subject: string; text: string; replyTo?: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await mailConfig();
  if (!c) return { ok: false, error: "Email isn't set up yet (Admin → Platform → Connections → Email)." };
  try {
    const t = nodemailer.createTransport({ host: c.host, port: c.port, secure: c.secure, auth: c.auth, connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 20_000 });
    await t.sendMail({ from: c.from, to: m.to, subject: oneLine(m.subject).slice(0, 200), text: m.text, replyTo: m.replyTo });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message.slice(0, 300) };
  }
}
