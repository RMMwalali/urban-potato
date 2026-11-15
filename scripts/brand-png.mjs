// Renders PNGs of the logo set (public/brand/*.svg) with Playwright's Chromium and copies the
// app icons and favicon into place. Run after `python3 scripts/brand.py`.
import { createRequire } from "module";
import fs from "fs";
import path from "path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const brand = path.join(root, "public/brand");
const jobs = [
  ["darling-wordmark.svg", "darling-wordmark.png", 3000],
  ["darling-wordmark-on-dark.svg", "darling-wordmark-on-dark.png", 3000],
  ["darling-wordmark-ink.svg", "darling-wordmark-ink.png", 3000],
  ["darling-wordmark-white.svg", "darling-wordmark-white.png", 3000],
  ["darling-icon.svg", "darling-icon-1024.png", 1024],
  ["darling-icon-dark.svg", "darling-icon-dark-1024.png", 1024],
  ["darling-profile-1080.svg", "darling-profile-1080.png", 1080],
  ["darling-social-1200x630.svg", "darling-social-1200x630.png", 1200],
  ["darling-email-header-1200x240.svg", "darling-email-header-1200x240.png", 1200],
  ["darling-icon.svg", "../icons/icon-512.png", 512],
  ["darling-icon.svg", "../icons/icon-192.png", 192],
  ["darling-icon-maskable.svg", "../icons/maskable-512.png", 512],
  ["darling-icon.svg", "../../src/app/apple-icon.png", 180],
  ["darling-favicon.svg", "../../src/app/icon2.png", 64],
];
const b = await chromium.launch();
const p = await b.newPage();
for (const [src, out, width] of jobs) {
  const svg = fs.readFileSync(path.join(brand, src), "utf8");
  const [, vw, vh] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const height = Math.round((width * Number(vh)) / Number(vw));
  await p.setViewportSize({ width, height });
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace(/width="[\d.]+" height="[\d.]+"/, `width="${width}" height="${height}"`)}</body></html>`);
  await p.locator("svg").screenshot({ path: path.join(brand, out), omitBackground: true });
  console.log(out, `${width}x${height}`);
}
fs.copyFileSync(path.join(brand, "darling-favicon.svg"), path.join(root, "src/app/icon1.svg"));
await b.close();
