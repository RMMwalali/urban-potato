"use client";
export function PrintButton() {
  return <button onClick={() => window.print()} className="btn-secondary btn-sm">Print</button>;
}
