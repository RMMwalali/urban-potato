"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Re-render the list when new notifications arrive. */
export function RefreshOnNew() {
  const router = useRouter();
  useEffect(() => {
    const on = () => router.refresh();
    window.addEventListener("darling:new", on);
    return () => window.removeEventListener("darling:new", on);
  }, [router]);
  return null;
}

export function MarkAllRead() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} className="label-caps text-muted hover:text-ink" onClick={async () => {
      setBusy(true);
      await fetch("/api/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      window.dispatchEvent(new Event("darling:read"));
      router.refresh();
      setBusy(false);
    }}>Mark all as read</button>
  );
}
