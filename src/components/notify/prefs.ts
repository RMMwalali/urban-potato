// Per-device sound preferences (each phone or computer decides whether it makes noise).
export type SoundPrefs = { sound: boolean; volume: number };
const KEY = "darling.sound";
export function readPrefs(): SoundPrefs {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? "null"); if (v && typeof v.sound === "boolean") return { sound: v.sound, volume: Number(v.volume) || 0.8 }; } catch {}
  return { sound: true, volume: 0.8 };
}
export function writePrefs(p: SoundPrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
  window.dispatchEvent(new CustomEvent("darling:prefs", { detail: p }));
}
