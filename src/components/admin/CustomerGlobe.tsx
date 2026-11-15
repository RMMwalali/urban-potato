"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GlobeInstance } from "globe.gl";

export type Pin = {
  id: string; name: string; slug: string; status: "active" | "lifetime" | "trial" | "lapsed" | "inactive"; plan: string;
  activity: number; level: number; place: string; lat: number | null; lng: number | null; staff: number; clients: number; since: string;
};
export type VisitorSpot = { lat: number; lng: number; place: string; visitors: number; attempts: number };
type Legend = Record<Pin["status"], { label: string; color: string }>;
type Datum = (Pin & { kind: "salon" }) | (VisitorSpot & { kind: "visitor"; id: string });

const ACTIVITY = ["Idle", "Light", "Steady", "Busy"];
const VISITOR_COLOR = "rgba(160, 200, 255, 0.55)";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function CustomerGlobe({ pins, visitors, legend }: { pins: Pin[]; visitors: VisitorSpot[]; legend: Legend }) {
  const box = useRef<HTMLDivElement>(null);
  const globe = useRef<GlobeInstance | null>(null);
  const hovered = useRef<string | null>(null);
  const [selected, setSelected] = useState<Pin | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const data: Datum[] = useMemo(
    () => [
      ...pins.filter((p) => p.lat != null && !hidden.has(p.status)).map((p) => ({ ...p, kind: "salon" as const })),
      ...(hidden.has("visitors") ? [] : visitors.map((v, i) => ({ ...v, kind: "visitor" as const, id: `v${i}` }))),
    ],
    [pins, visitors, hidden],
  );

  // Pin geometry: height shows activity, hover makes the pin grow.
  const altitude = (d: Datum) => (d.kind === "visitor" ? 0.006 : 0.03 + d.level * 0.07) * (hovered.current === d.id ? 1.7 : 1);
  const radius = (d: Datum) => (d.kind === "visitor" ? 0.18 + Math.min(d.visitors, 20) * 0.02 : 0.38) * (hovered.current === d.id ? 1.9 : 1);
  const color = (d: Datum) => (d.kind === "visitor" ? VISITOR_COLOR : legend[d.status].color);

  const rings = (list: Datum[]) =>
    list.filter((d): d is Pin & { kind: "salon" } => d.kind === "salon" && (d.level >= 2 || hovered.current === d.id) && (d.status === "active" || d.status === "lifetime" || d.status === "trial" || hovered.current === d.id));

  useEffect(() => {
    let disposed = false;
    const el = box.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    (async () => {
      try {
        const [{ default: Globe }, THREE] = await Promise.all([import("globe.gl"), import("three")]);
        if (disposed) return;
        const g = new Globe(el, { animateIn: !reduce })
          .width(el.clientWidth).height(el.clientHeight)
          .backgroundColor("rgba(0,0,0,0)")
          .globeImageUrl("/globe/earth-blue-marble.jpg")
          .bumpImageUrl("/globe/earth-topology.png")
          .showAtmosphere(true).atmosphereColor("#8fc1ff").atmosphereAltitude(0.2)
          .pointLat("lat").pointLng("lng")
          .pointsTransitionDuration(650)
          .pointResolution(24)
          .ringLat("lat").ringLng("lng")
          .ringColor((d: object) => {
            const c = legend[(d as Pin).status].color;
            return (t: number) => `${c}${Math.round((1 - t) * 255).toString(16).padStart(2, "0")}`;
          })
          .ringMaxRadius((d: object) => (hovered.current === (d as Pin).id ? 5 : 2.2 + (d as Pin).level * 0.6))
          .ringPropagationSpeed((d: object) => (hovered.current === (d as Pin).id ? 4 : 1.2))
          .ringRepeatPeriod((d: object) => (hovered.current === (d as Pin).id ? 500 : 2600 - (d as Pin).level * 400))
          .ringAltitude(0.004)
          .pointLabel((o: object) => {
            const d = o as Datum;
            if (d.kind === "visitor")
              return `<div class="globe-tip"><b>${esc(d.place)}</b><span>${d.visitors} sign-up visitor${d.visitors === 1 ? "" : "s"} without an account${d.attempts ? ` · ${d.attempts} failed attempt${d.attempts === 1 ? "" : "s"}` : ""}</span></div>`;
            return `<div class="globe-tip"><i style="background:${legend[d.status].color}"></i><b>${esc(d.name)}</b><span>${esc(d.place || "Location unknown")}</span><span>${legend[d.status].label}${d.status === "active" ? ` · ${esc(d.plan === "annual" ? "annual" : "monthly")}` : ""} · ${ACTIVITY[d.level]} (${d.activity} in 30 days)</span></div>`;
          })
          .onPointHover((o: object | null) => {
            const id = (o as Datum | null)?.id ?? null;
            if (id === hovered.current) return;
            hovered.current = id;
            el.style.cursor = id ? "pointer" : "grab";
            const ctl = g.controls();
            ctl.autoRotate = !id && !reduce;
            // re-apply accessors so the hovered pin animates up and out, and gets a fast ring burst
            g.pointAltitude(altitude as (d: object) => number).pointRadius(radius as (d: object) => number);
            g.ringsData(rings(g.pointsData() as Datum[]));
          })
          .onPointClick((o: object) => {
            const d = o as Datum;
            g.pointOfView({ lat: d.lat ?? 0, lng: d.lng ?? 0, altitude: 0.75 }, reduce ? 0 : 1400);
            if (d.kind === "salon") setSelected(d);
          });

        // Terrain relief and shiny oceans.
        const mat = g.globeMaterial() as InstanceType<typeof THREE.MeshPhongMaterial>;
        mat.bumpScale = 14;
        new THREE.TextureLoader().load("/globe/earth-water.png", (tex) => {
          mat.specularMap = tex;
          mat.specular = new THREE.Color("#4d77a3");
          mat.shininess = 22;
          mat.needsUpdate = true;
        });

        const ctl = g.controls();
        ctl.autoRotate = !reduce;
        ctl.autoRotateSpeed = 0.45;
        ctl.enableDamping = true;
        ctl.minDistance = 130;
        ctl.maxDistance = 600;
        g.pointOfView({ lat: 8, lng: 25, altitude: 3.6 }, 0);
        setTimeout(() => !disposed && g.pointOfView({ lat: -0.5, lng: 37.5, altitude: 1.8 }, reduce ? 0 : 2600), 400);

        const ro = new ResizeObserver(() => g.width(el.clientWidth).height(el.clientHeight));
        ro.observe(el);
        globe.current = g;
        setReady(true);
        return () => ro.disconnect();
      } catch (e) {
        console.error("globe failed to start", e);
        setFailed(true);
      }
    })();
    return () => {
      disposed = true;
      globe.current?._destructor();
      globe.current = null;
      el.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const g = globe.current;
    if (!g) return;
    g.pointsData(data).pointColor(color as (d: object) => string).pointAltitude(altitude as (d: object) => number).pointRadius(radius as (d: object) => number);
    g.ringsData(rings(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ready]);

  const toggle = (k: string) => setHidden((h) => { const n = new Set(h); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const counts = (s: string) => pins.filter((p) => p.status === s).length;
  const unplaced = pins.filter((p) => p.lat == null).length;

  return (
    <div className="relative overflow-hidden bg-[#0b0f17] text-paper">
      <div ref={box} className="h-[68vh] min-h-[420px] w-full cursor-grab active:cursor-grabbing" aria-label="3D globe of salon locations" role="img" />
      {!ready && !failed && <p className="label-caps absolute inset-0 flex items-center justify-center text-paper/50">Loading globe…</p>}
      {failed && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-[14px] text-paper/70">This browser can&apos;t show the 3D globe (WebGL is off). The lists below have the same information.</p>}

      {/* Legend + filters */}
      <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap gap-2 sm:left-6 sm:top-6">
        {(Object.keys(legend) as Pin["status"][]).map((k) => (
          <button key={k} onClick={() => toggle(k)} className={`flex items-center gap-2 border border-paper/25 bg-black/40 px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] backdrop-blur transition-all duration-500 hover:border-paper/70 ${hidden.has(k) ? "opacity-35" : ""}`}>
            <span className="h-2 w-2 rounded-full" style={{ background: legend[k].color }} />{legend[k].label} <span className="text-paper/50">{counts(k)}</span>
          </button>
        ))}
        <button onClick={() => toggle("visitors")} className={`flex items-center gap-2 border border-paper/25 bg-black/40 px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] backdrop-blur transition-all duration-500 hover:border-paper/70 ${hidden.has("visitors") ? "opacity-35" : ""}`}>
          <span className="h-2 w-2 rounded-full" style={{ background: VISITOR_COLOR }} />Visitors, no account <span className="text-paper/50">{visitors.reduce((t, v) => t + v.visitors, 0)}</span>
        </button>
      </div>
      <p className="absolute bottom-4 left-4 text-[11px] uppercase tracking-[0.06em] text-paper/45 sm:bottom-6 sm:left-6">
        Pin height = bookings + sales in 30 days · rings = busy · drag to turn, scroll to zoom{unplaced ? ` · ${unplaced} without a location` : ""}
      </p>

      {/* Selected salon */}
      <div className={`absolute right-4 top-16 w-[min(320px,calc(100%-2rem))] border border-paper/25 bg-black/60 p-5 backdrop-blur transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] sm:right-6 sm:top-6 ${selected ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-8 opacity-0"}`}>
        {selected && (
          <>
            <div className="flex items-start justify-between gap-4">
              <p className="label-caps" style={{ color: legend[selected.status].color }}>{legend[selected.status].label}</p>
              <button onClick={() => { setSelected(null); globe.current?.pointOfView({ altitude: 1.8 }, 1200); }} className="label-caps text-paper/60 hover:text-paper">Close</button>
            </div>
            <p className="mt-3 text-[22px] leading-tight">{selected.name}</p>
            <p className="mt-1 text-[13px] text-paper/60">{selected.place || "Location unknown"}</p>
            <dl className="mt-5 grid grid-cols-2 gap-y-3 border-t border-paper/20 pt-4 text-[13px]">
              <dt className="text-paper/50">Activity</dt><dd>{ACTIVITY[selected.level]} · {selected.activity}</dd>
              <dt className="text-paper/50">Plan</dt><dd className="capitalize">{selected.plan === "standard" ? "monthly" : selected.plan}</dd>
              <dt className="text-paper/50">Staff</dt><dd>{selected.staff}</dd>
              <dt className="text-paper/50">Clients</dt><dd>{selected.clients}</dd>
              <dt className="text-paper/50">Joined</dt><dd>{new Date(selected.since).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</dd>
            </dl>
            <Link href={`/admin/businesses/${selected.id}`} className="btn btn-sm mt-5 border-paper text-paper hover:bg-paper hover:text-ink">Open salon</Link>
          </>
        )}
      </div>
    </div>
  );
}
