// Tell Bing, Yandex, Seznam and other IndexNow engines about every public URL.
// Usage: npm run indexnow -- https://darlinghq.co.ke
// The key file public/99d7ba8d2f6002740db36b2ab1a23df1.txt must be live at https://darlinghq.co.ke/99d7ba8d2f6002740db36b2ab1a23df1.txt first.
import { GUIDES } from "../src/content/guides";

const KEY = "99d7ba8d2f6002740db36b2ab1a23df1";
const base = (process.argv[2] || process.env.APP_URL || "").replace(/\/$/, "");
if (!base.startsWith("https://")) {
  console.error("Pass your live https URL, e.g. npm run indexnow -- https://darlinghq.co.ke");
  process.exit(1);
}
const host = new URL(base).host;
const urlList = [`${base}/`, `${base}/guides`, ...GUIDES.map((g) => `${base}/guides/${g.slug}`), `${base}/signup`];

(async () => {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: KEY, keyLocation: `${base}/${KEY}.txt`, urlList }),
  });
  console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URLs`, res.status === 200 || res.status === 202 ? "(accepted)" : await res.text());
})();
