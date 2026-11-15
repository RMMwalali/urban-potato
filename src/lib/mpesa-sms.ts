// Parse M-Pesa confirmation SMS text into code, amount, payer name and time.
// Works for till/paybill/Pochi/personal "received" messages. Results are UNVERIFIED (SMS can be forged);
// only Safaricom C2B callbacks are treated as verified.

export type ParsedMpesa = { code: string; amount: number; payerName: string | null; phone: string | null; when: string | null };

const CODE = /\b([A-Z0-9]{10})\b/;
const AMOUNT = /(?:Ksh|KES)\s?([\d,]+(?:\.\d{1,2})?)/i;
const DATE = /on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s?[AP]M)/i;

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim();

export function parseMpesaSms(text: string): ParsedMpesa | null {
  const t = text.replace(/\s+/g, " ").trim();
  const code = t.toUpperCase().match(CODE)?.[1];
  const amt = t.match(AMOUNT)?.[1];
  if (!code || !amt || !/\d/.test(code) || !/[A-Z]/.test(code)) return null;

  let payerName: string | null = null;
  let phone: string | null = null;
  // "...received from JOHN DOE 0712345678 on..." or "...received from 2547******78 JOHN DOE on..."
  const from = t.match(/(?:received|receive)\s+(?:Ksh\s?[\d,.]+\s+)?from\s+(.+?)\s+on\s+\d/i)?.[1];
  if (from) {
    const phoneMatch = from.match(/(\+?\d[\d*]{6,}\d)/);
    phone = phoneMatch?.[1] ?? null;
    const name = from.replace(/(\+?\d[\d*]{6,}\d)/, "").replace(/[.,]$/, "").trim();
    payerName = name ? titleCase(name) : null;
  }
  const d = t.match(DATE);
  return { code, amount: Number(amt.replace(/,/g, "")), payerName, phone, when: d ? `${d[1]} ${d[2]}` : null };
}

export const looksLikeCode = (s: string) => /^[A-Z0-9]{10}$/.test(s.trim().toUpperCase()) && /\d/.test(s) && /[A-Za-z]/.test(s);
