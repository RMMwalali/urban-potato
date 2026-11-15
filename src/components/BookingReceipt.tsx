"use client";
// Booking confirmation that prints, adapted from the receipt-printer skill (.claude/skills/receipt-printer):
// - it only appears after the server has confirmed the booking (never on a timer);
// - it is real text (selectable, readable by screen readers, printable);
// - nothing here was paid unless a deposit really was, so it never says "total paid";
// - it also lives at a permanent address (the client's booking link), linked at the bottom.
import { useEffect, useRef, useState } from "react";
import type { Slip } from "@/lib/slip";

export function BookingReceipt({ slip, animate = true }: { slip: Slip; animate?: boolean }) {
  const paper = useRef<HTMLElement>(null);
  const [h, setH] = useState(0);
  const [printed, setPrinted] = useState(!animate);
  const m = (n: number) => `${slip.currency} ${n.toLocaleString()}`;

  useEffect(() => {
    const measure = () => setH(paper.current ? paper.current.offsetHeight + 14 : 0);
    measure();
    const ro = new ResizeObserver(measure);
    if (paper.current) ro.observe(paper.current);
    // start printing on the next frame so the slot animates open from zero
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setPrinted(true)));
    return () => { ro.disconnect(); cancelAnimationFrame(id); };
  }, []);

  return (
    <div className="bk-receipt mx-auto w-full max-w-[440px]">
      <div className={`bk-card ${printed ? "is-done" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[17px] leading-tight">{slip.service}</p>
            <p className="mt-1 text-[13px] text-paper/60">{slip.date} · {slip.time}</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] uppercase tracking-[0.06em] text-paper/60">Price</p>
            <p className="text-[20px] tabular-nums">{m(slip.price)}</p>
          </div>
        </div>
        <p className="bk-status" role="status"><span className="bk-dot" aria-hidden />{printed ? "You're booked" : "Confirming your booking"}</p>
      </div>

      <div className="bk-slot" style={{ height: printed ? (animate ? h : "auto") : 0 }}>
        <div className="bk-wrap" style={{ transform: printed ? "translateY(0)" : "translateY(-100%)" }}>
          <article ref={paper} className="bk-paper" aria-label={`Booking ${slip.ref} at ${slip.salon}`}>
            <header className="mb-4 text-center">
              {slip.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slip.logo} alt="" className="mx-auto mb-3 h-12 w-auto max-w-[140px] object-contain" />
              )}
              <p className="text-[15px] uppercase tracking-[0.08em]">{slip.salon}</p>
              {slip.address && <p className="bk-faint">{slip.address}</p>}
              {slip.phone && <p className="bk-faint">{slip.phone}</p>}
            </header>
            <hr className="bk-rule" />
            <div className="bk-row"><span>{slip.service}</span><span>{m(slip.price)}</span></div>
            <div className="bk-row bk-faint"><span>{slip.sub}</span><span /></div>
            <hr className="bk-rule" />
            {slip.depositPaid && (
              <>
                <div className="bk-row"><span>Deposit paid · M-Pesa</span><span>−{m(slip.deposit)}</span></div>
                {slip.depositRef && <div className="bk-row bk-faint"><span>{slip.depositRef}</span><span /></div>}
              </>
            )}
            <div className="bk-row bk-strong"><span>{slip.depositPaid ? "BALANCE AT THE SALON" : "PAY AT THE SALON"}</span><span>{m(slip.balance)}</span></div>
            <hr className="bk-rule" />
            <div className="bk-row bk-meta"><span className="bk-faint">Booking</span><span>{slip.ref}</span></div>
            <div className="bk-row bk-meta"><span className="bk-faint">Name</span><span>{slip.client}</span></div>
            <div className="bk-row bk-meta"><span className="bk-faint">Date</span><span>{slip.date}</span></div>
            <div className="bk-row bk-meta"><span className="bk-faint">Time</span><span>{slip.time}</span></div>
            <div className="bk-barcode" aria-hidden />
            <p className="bk-faint mt-1 text-center text-[10px] tracking-[0.25em]" aria-hidden>{slip.ref}</p>
            <a href={slip.href} className="bk-link">View, change or cancel this booking</a>
          </article>
        </div>
      </div>
    </div>
  );
}
