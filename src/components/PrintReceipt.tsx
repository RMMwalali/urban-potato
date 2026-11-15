"use client";
import { useEffect, useRef, useState } from "react";

// Receipt printing for POS thermal printers (58 / 80 mm rolls) and ordinary A4 printers.
// The receipt is laid out at the paper's real width on screen, so what you see is what prints;
// just before printing the page is sized to the receipt's exact length, so a roll doesn't waste paper.
const PAPERS = {
  "80": { label: "80 mm receipt printer", width: "72mm", page: (h: number) => `size: 80mm ${h}mm; margin: 0;` },
  "58": { label: "58 mm receipt printer", width: "48mm", page: (h: number) => `size: 58mm ${h}mm; margin: 0;` },
  a4: { label: "A4 / office printer", width: "92mm", page: () => "size: A4; margin: 16mm;" },
} as const;
type Paper = keyof typeof PAPERS;
const KEY = "darling.paper";

export function PrintReceipt({ children, label = "Print receipt", auto = false, staff = true }: { children: React.ReactNode; label?: string; auto?: boolean; staff?: boolean }) {
  // staff pick the till printer's paper; clients just print on whatever printer they have (A4)
  const [paper, setPaper] = useState<Paper>(staff ? "80" : "a4");
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!staff) return; try { const p = localStorage.getItem(KEY) as Paper | null; if (p && p in PAPERS) setPaper(p); } catch {} }, [staff]);

  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-receipt-page", "");
    document.head.appendChild(style);
    const size = () => {
      const px = area.current?.offsetHeight ?? 600;
      style.textContent = `@page { ${PAPERS[paper].page(Math.ceil(px / 3.7795) + 8)} }`;
    };
    // Take everything but the receipt out of the layout while printing, so a roll printer
    // doesn't feed blank paper for the rest of the page.
    const marked: Element[] = [];
    const before = () => {
      for (let n: Element | null = area.current; n && n !== document.documentElement; n = n.parentElement) {
        n.setAttribute("data-print-path", "");
        marked.push(n);
        for (const sib of Array.from(n.parentElement?.children ?? [])) if (sib !== n && sib.tagName !== "SCRIPT" && sib.tagName !== "STYLE") { sib.setAttribute("data-print-hidden", ""); marked.push(sib); }
      }
      size();
    };
    const after = () => { for (const el of marked.splice(0)) { el.removeAttribute("data-print-path"); el.removeAttribute("data-print-hidden"); } };
    size();
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after); after(); style.remove(); };
  }, [paper]);

  useEffect(() => { if (auto) setTimeout(() => window.print(), 400); }, [auto]);

  const choose = (p: Paper) => { setPaper(p); try { localStorage.setItem(KEY, p); } catch {} };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        {staff && (
          <select value={paper} onChange={(e) => choose(e.target.value as Paper)} className="input w-auto py-1.5 text-[13px]" aria-label="Printer paper">
            {Object.entries(PAPERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        )}
        <button type="button" onClick={() => window.print()} className={staff ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>{label}</button>
      </div>
      <div ref={area} className="print-area mx-auto" data-paper={paper} style={{ width: PAPERS[paper].width, maxWidth: "100%" }}>
        {children}
      </div>
    </div>
  );
}
