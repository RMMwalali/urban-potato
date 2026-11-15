import { clientGuides } from "./clients";
import { profitGuides } from "./profit";
import { runningGuides } from "./running";
import { softwareGuides } from "./software";
import { staffGuides } from "./staff";
import type { Guide } from "./types";

export type { Guide, Block } from "./types";

export const GUIDES: Guide[] = [...softwareGuides, ...profitGuides, ...clientGuides, ...staffGuides, ...runningGuides];

export const CATEGORIES: Guide["category"][] = ["Choosing software", "Profit & pricing", "Clients", "Staff", "Running the salon"];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);

/** Plain-text rendering, used for llms-full.txt and word counts. */
export function guideToText(g: Guide) {
  const out: string[] = [`# ${g.title}`, "", g.description, "", "Key points:", ...g.takeaways.map((t) => `- ${t}`), ""];
  for (const b of g.blocks) {
    if (b.h) out.push(`## ${b.h}`, "");
    for (const p of b.p ?? []) out.push(p, "");
    for (const l of b.list ?? []) out.push(`- ${l}`);
    (b.steps ?? []).forEach((s, i) => out.push(`${i + 1}. ${s}`));
    if (b.list || b.steps) out.push("");
  }
  out.push("## Questions", "");
  for (const f of g.faqs) out.push(`Q: ${f.q}`, `A: ${f.a}`, "");
  return out.join("\n");
}

export const readMinutes = (g: Guide) => Math.max(2, Math.round(guideToText(g).split(/\s+/).length / 220));
