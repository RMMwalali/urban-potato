"use client";
import { useState } from "react";
import { logContact } from "@/app/actions/leads";

type Msg = { whatsapp: string; instagram: string; emailSubject: string; email: string; followUp: string };

/**
 * Opens the admin's own WhatsApp / Instagram / email with the message ready. Nothing is sent from
 * the server: the admin presses send in their app. Each open is logged on the lead.
 */
export function LeadOutreach({ id, wa, instagram, email, messages, contacted, blocked }: { id: string; wa: string | null; instagram: string | null; email: string | null; messages: Msg; contacted: boolean; blocked: boolean }) {
  const [kind, setKind] = useState<"first" | "follow">(contacted ? "follow" : "first");
  const [text, setText] = useState(contacted ? messages.followUp : messages.whatsapp);
  const [igText, setIgText] = useState(contacted ? messages.followUp : messages.instagram);
  const [note, setNote] = useState("");
  if (blocked) return <p className="border-l-2 border-pink bg-panel px-4 py-3 text-[14px]">This salon asked not to be contacted. Outreach is switched off for them.</p>;

  const choose = (k: "first" | "follow") => { setKind(k); setText(k === "first" ? messages.whatsapp : messages.followUp); setIgText(k === "first" ? messages.instagram : messages.followUp); };
  const go = async (channel: string, url: string, body: string) => {
    window.open(url, "_blank", "noopener");
    await logContact(id, channel, body);
    setNote(`Logged: ${channel} opened. Send it in the app, then come back to record any reply.`);
  };
  const copy = async (s: string) => { try { await navigator.clipboard.writeText(s); return true; } catch { return false; } };

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border border-ink p-0.5 text-[12px] uppercase tracking-[0.06em]">
        {(["first", "follow"] as const).map((k) => (
          <button key={k} type="button" onClick={() => choose(k)} className={`flex-1 px-3 py-1.5 ${kind === k ? "bg-ink text-paper" : "hover:bg-panel"}`}>{k === "first" ? "First message" : "Follow-up"}</button>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="msg">WhatsApp / email message</label>
        <textarea id="msg" value={text} onChange={(e) => setText(e.target.value)} rows={9} className="input text-[14px]" />
      </div>
      <div className="flex flex-wrap gap-2">
        {wa && <button type="button" onClick={() => go("whatsapp", `https://wa.me/${wa}?text=${encodeURIComponent(text)}`, text)} className="btn-primary btn-sm">Open in WhatsApp</button>}
        {email && <button type="button" onClick={() => go("email", `mailto:${email}?subject=${encodeURIComponent(messages.emailSubject)}&body=${encodeURIComponent(kind === "first" ? messages.email : text)}`, kind === "first" ? messages.email : text)} className="btn-secondary btn-sm">Open email</button>}
        <button type="button" onClick={async () => setNote((await copy(text)) ? "Copied." : "Couldn't copy; select the text instead.")} className="btn-secondary btn-sm">Copy</button>
      </div>
      {instagram && (
        <div className="border-t border-ink/20 pt-4">
          <label className="label" htmlFor="ig">Instagram DM (shorter)</label>
          <textarea id="ig" value={igText} onChange={(e) => setIgText(e.target.value)} rows={5} className="input text-[14px]" />
          <button type="button" onClick={async () => { await copy(igText); await go("instagram", `https://ig.me/m/${instagram}`, igText); setNote("Message copied. Paste it into the Instagram chat that just opened, then send."); }} className="btn-secondary btn-sm mt-2">Copy &amp; open Instagram DM</button>
        </div>
      )}
      {!wa && !email && !instagram && <p className="text-[14px] text-muted">No public contact for this salon yet. Add a phone, Instagram or email first.</p>}
      {note && <p className="border-l-2 border-ink bg-panel px-3 py-2 text-[13px]">{note}</p>}
    </div>
  );
}
