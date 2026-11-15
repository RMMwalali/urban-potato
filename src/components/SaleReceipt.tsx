// Sale receipt in the same design as the booking slip (shared .bk-* styles), sized by PrintReceipt.
export type SaleReceiptData = {
  salon: string; logo: string | null; address: string | null; phone: string | null;
  number: number; date: string; client: string | null; currency: string;
  items: { name: string; staff: string | null; qty: number; amount: number }[];
  subtotal: number; discount: number; tip: number; total: number; depositApplied: number;
  payments: { label: string; detail: string | null; amount: number; change: number | null; verified: boolean | null }[];
};

export function SaleReceipt({ r }: { r: SaleReceiptData }) {
  const m = (n: number) => `${r.currency} ${n.toLocaleString()}`;
  const paidToday = Math.max(r.total - r.depositApplied, 0);
  return (
    <article className="bk-paper rcpt" aria-label={`Receipt ${r.number} from ${r.salon}`}>
      <header className="mb-4 text-center">
        {r.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.logo} alt="" className="rcpt-logo mx-auto mb-3 h-12 w-auto max-w-[70%] object-contain" />
        )}
        <p className="text-[15px] uppercase tracking-[0.08em]">{r.salon}</p>
        {r.address && <p className="bk-faint">{r.address}</p>}
        {r.phone && <p className="bk-faint">{r.phone}</p>}
      </header>
      <div className="bk-row bk-meta"><span className="bk-faint">Receipt</span><span>#{r.number}</span></div>
      <div className="bk-row bk-meta"><span className="bk-faint">Date</span><span>{r.date}</span></div>
      {r.client && <div className="bk-row bk-meta"><span className="bk-faint">Client</span><span>{r.client}</span></div>}
      <hr className="bk-rule" />
      {r.items.map((i, k) => (
        <div key={k}>
          <div className="bk-row"><span>{i.qty > 1 ? `${i.qty} × ` : ""}{i.name}</span><span>{m(i.amount)}</span></div>
          {i.staff && <div className="bk-row bk-faint"><span>with {i.staff}</span><span /></div>}
        </div>
      ))}
      <hr className="bk-rule" />
      {(r.discount > 0 || r.tip > 0) && <div className="bk-row bk-faint"><span>Subtotal</span><span>{m(r.subtotal)}</span></div>}
      {r.discount > 0 && <div className="bk-row bk-faint"><span>Discount</span><span>−{m(r.discount)}</span></div>}
      {r.tip > 0 && <div className="bk-row bk-faint"><span>Tip</span><span>{m(r.tip)}</span></div>}
      <div className="bk-row bk-strong"><span>TOTAL</span><span>{m(r.total)}</span></div>
      {r.depositApplied > 0 && (
        <>
          <div className="bk-row"><span>Deposit paid earlier</span><span>−{m(r.depositApplied)}</span></div>
          <div className="bk-row bk-strong"><span>PAID TODAY</span><span>{m(paidToday)}</span></div>
        </>
      )}
      <hr className="bk-rule" />
      {r.payments.map((p, k) => (
        <div key={k}>
          <div className="bk-row"><span>{p.label}</span><span>{m(p.amount)}</span></div>
          {(p.detail || p.verified !== null) && <div className="bk-row bk-faint bk-meta"><span>{[p.detail, p.verified === true ? "confirmed by Safaricom" : p.verified === false ? "unverified" : null].filter(Boolean).join(" · ")}</span><span /></div>}
          {p.change ? <div className="bk-row bk-faint bk-meta"><span>Change</span><span>{m(p.change)}</span></div> : null}
        </div>
      ))}
      <div className="bk-barcode" aria-hidden />
      <p className="bk-faint mt-1 text-center text-[10px] tracking-[0.25em]" aria-hidden>{String(r.number).padStart(6, "0")}</p>
      <p className="mt-3 text-center text-[12px]">Thank you for visiting!</p>
    </article>
  );
}
