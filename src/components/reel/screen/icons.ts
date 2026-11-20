// Small line icons for the reel's 3D tiles (24×24, stroke-based, drawn for this project).
export const ICONS = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.6 2.6L16.5 9"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.6.2 4.6 2 5.3 5.4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-5h4v5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  x: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 13.5h2"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
} as const;
export type IconName = keyof typeof ICONS;

export const svgIcon = (name: IconName, size: number, color: string, stroke = 2) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

/** A white UI tile: coloured icon disc, a bold line and a quieter line. Returns the element (unpositioned). */
export function tile(doc: Document, o: { icon: IconName; title: string; sub: string; accent: string; w: number }) {
  const el = doc.createElement("div");
  const u = o.w / 260; // design unit
  el.style.cssText = `position:absolute;width:${o.w}px;padding:${16 * u}px ${18 * u}px;border-radius:${18 * u}px;background:linear-gradient(160deg,#ffffff 0%,#ffffff 55%,#f6f7fb 100%);box-shadow:0 ${18 * u}px ${44 * u}px ${o.accent}38, 0 ${2 * u}px ${6 * u}px rgba(20,24,30,0.08), inset 0 0 0 1px rgba(20,24,30,0.05);display:flex;align-items:center;gap:${14 * u}px;transform-style:preserve-3d;backface-visibility:hidden;font-family:inherit`;
  const disc = doc.createElement("div");
  disc.style.cssText = `flex:none;width:${46 * u}px;height:${46 * u}px;border-radius:${14 * u}px;background:linear-gradient(140deg, ${o.accent}, ${o.accent}cc);display:flex;align-items:center;justify-content:center;box-shadow:0 ${6 * u}px ${14 * u}px ${o.accent}55`;
  disc.innerHTML = svgIcon(o.icon, 26 * u, "#ffffff", 2.2);
  const txt = doc.createElement("div");
  txt.style.cssText = "min-width:0;line-height:1.2";
  const t = doc.createElement("div"); t.textContent = o.title; t.style.cssText = `font-size:${19 * u}px;font-weight:600;color:#1c1f24;white-space:nowrap`;
  const s = doc.createElement("div"); s.textContent = o.sub; s.style.cssText = `margin-top:${4 * u}px;font-size:${15 * u}px;color:#6b7078;white-space:nowrap`;
  txt.append(t, s);
  el.append(disc, txt);
  return el;
}
