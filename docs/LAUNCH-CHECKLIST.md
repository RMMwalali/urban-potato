# Darling launch & discovery checklist

Work through this top to bottom. Items marked **(once)** are one-off setup; **(monthly)** items are ongoing. Menu names in third-party tools change often: if a label below doesn't match exactly, look for the closest equivalent.

What's already built into the site (nothing to do, just know it exists):

| Built in | Where |
|---|---|
| Sitemap with every page and guide | `/sitemap.xml` |
| robots.txt that **explicitly allows** search and AI crawlers (Google, Bing, OpenAI, Anthropic, Perplexity, Apple, Common Crawl…) and blocks private areas | `/robots.txt` |
| AI-readable site summary and full guide text | `/llms.txt`, `/llms-full.txt` |
| Structured data: Organization, WebSite, SoftwareApplication (with price), FAQ, Article, Breadcrumbs | Home page, `/guides`, every guide |
| Social share card (text only) | `/opengraph-image` |
| 13 guides answering the questions salon owners ask | `/guides` |
| IndexNow key file | `/99d7ba8d2f6002740db36b2ab1a23df1.txt` |
| Admin-editable titles, descriptions, Google + Bing verification, social profiles | Admin → SEO & meta |

---

## 0. Before anything else (once)

- [ ] **Buy `darlinghq.co.ke`** from a KENIC-accredited registrar (also consider `darlinghq.ke` and `darlingheadq.com`, pointed at it). Search engines and AI assistants trust a real domain far more than `*.vercel.app`.
- [ ] **Vercel → Project → Settings → Domains:** add the domain and follow the DNS instructions. Add both `darlinghq.co.ke` and `www.darlinghq.co.ke`, and redirect one to the other.
- [ ] **Vercel → Settings → Environment Variables:** set `APP_URL=https://darlinghq.co.ke` (no trailing slash), plus `AUTH_SECRET`, `ENCRYPTION_KEY` and `CRON_SECRET` if not set yet. **Redeploy.**
- [ ] **Admin → SEO & meta:** set *Canonical site URL* to the same `https://darlinghq.co.ke`.
- [ ] **Admin → Platform settings:** fill in support email, phone and WhatsApp. They appear in the footer and in the Organization data that AI assistants read.
- [ ] Open `https://darlinghq.co.ke/robots.txt`, `/sitemap.xml` and `/llms.txt` in a browser and check they show your real domain, not `localhost` or `vercel.app`.

## 1. Cloudflare (if your domain's DNS is on Cloudflare) (once)

- [ ] **DNS:** add the records Vercel gives you (usually an `A` record for the root and a `CNAME` to `cname.vercel-dns.com` for `www`). Vercel recommends **DNS only (grey cloud)**, not proxied, so its SSL and caching work properly.
- [ ] **AI crawlers:** Cloudflare can block AI crawlers by default, especially on newer domains. Look under **Security → Bots** or **AI Crawl Control**, and make sure *Block AI bots* is **off** and GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, etc. are **allowed**. If they're blocked, AI assistants can't read or recommend Darling.
- [ ] **Managed robots.txt:** if Cloudflare offers to manage or prepend to your robots.txt, leave it **off** so the site's own robots.txt is served as-is.
- [ ] **Bot Fight Mode / Super Bot Fight Mode:** make sure *verified bots* are allowed. Aggressive bot blocking can stop Googlebot and Bingbot too.
- [ ] **Crawler Hints:** turn on if available. It pings IndexNow automatically when pages change, but only works on proxied traffic.
- [ ] **Email:** set up SPF/DKIM/DMARC if you'll send email from the domain.

## 2. Google Search Console (once, then monthly)

- [ ] Go to **search.google.com/search-console** → *Add property* → **Domain** property → verify with the **DNS TXT record** (add it in Cloudflare or your registrar). This covers every subdomain and http/https.
  - Alternative: URL-prefix property → *HTML tag* → paste only the `content="…"` value into **Admin → SEO & meta → Google Search Console verification**.
- [ ] **Sitemaps** → submit `https://darlinghq.co.ke/sitemap.xml`.
- [ ] **URL Inspection** → inspect the home page, `/guides` and 3–4 guides → *Request indexing*.
- [ ] **Rich results test** (search.google.com/test/rich-results): test the home page and one guide. You should see FAQ, Article, Breadcrumb and Software App items.
- [ ] (monthly) Check *Pages* for "Crawled – currently not indexed" and *Performance* for which questions bring people in. Write new guides for the gaps.

## 3. Bing Webmaster Tools (once): this also feeds ChatGPT search, Microsoft Copilot and DuckDuckGo

- [ ] Go to **bing.com/webmasters** → sign in → **Import from Google Search Console** (fastest), or add the site and verify:
  - DNS CNAME, or
  - *Meta tag*: paste the `content` value of `msvalidate.01` into **Admin → SEO & meta → Bing Webmaster verification**.
- [ ] **Sitemaps** → submit `https://darlinghq.co.ke/sitemap.xml`.
- [ ] **URL Submission / IndexNow**: Bing supports IndexNow natively (next step).
- [ ] Check **AI Performance** or **Copilot** reports if available. Bing has been adding visibility data for AI answers.

## 4. IndexNow: instant indexing for Bing, Yandex, Seznam and others (every time you publish)

- [ ] After the domain is live, open `https://darlinghq.co.ke/99d7ba8d2f6002740db36b2ab1a23df1.txt`. It should show the key.
- [ ] From the project folder on your computer:
  ```bash
  npm run indexnow -- https://darlinghq.co.ke
  ```
  Run it again whenever you publish or update guides.

## 5. Google Business Profile (once)

- [ ] **business.google.com:** create a profile for Darling (category such as *Software company*), add your service area (Kenya) and website. It helps branded searches and Google Maps/AI Overviews mention you.
- [ ] Encourage salons using Darling to put their **booking link** in their own Google Business Profile *Appointments* field. Every salon booking page links back to you ("Powered by Darling").

## 6. Social profiles (once)

- [ ] Create or claim the same handle everywhere: **TikTok, Instagram, Facebook, LinkedIn (company page), X, YouTube**.
- [ ] Put `https://darlinghq.co.ke` in every bio.
- [ ] Paste all profile URLs into **Admin → SEO & meta → Social profiles** (one per line). They become `sameAs` links in the Organization data, which is how search engines and AI connect your brand across sites.
- [ ] **TikTok Business account:** business accounts can only use sounds from TikTok's **Commercial Music Library** in organic posts. Use the reel engine's built-in score or a licensed track, or add a CML sound inside TikTok.

## 7. Software directories and review sites (once, then keep reviews coming)

AI assistants answer "best salon software in Kenya" largely from what's written about you on other sites. Get listed where buyers and AI look:

- [ ] **Capterra / GetApp / Software Advice** (one vendor portal for all three).
- [ ] **G2**
- [ ] **Product Hunt** (plan a launch day; share the reel).
- [ ] **AlternativeTo:** list Darling as an alternative to Fresha, Booksy, Vagaro, Square Appointments, SimplyBook.me.
- [ ] **SaaSHub**, **SaaSworthy**, **Crozdesk**
- [ ] **Trustpilot:** claim the business profile and ask happy salons to review.
- [ ] Kenyan business directories and startup lists (e.g. local tech/startup directories, chamber or association listings).
- [ ] Use the **same name, one-line description and URL** everywhere. Consistency helps AI match all mentions to you.

## 8. Generative engine optimisation (GEO): getting recommended by AI assistants

There is no "submit" form for ChatGPT, Claude, Gemini or Perplexity. They recommend what they can **crawl** and what is **talked about**. Concretely:

- [ ] **Allow their crawlers** (done in robots.txt; check Cloudflare, step 1).
- [ ] **Be indexed by Bing and Google** (steps 2–4). ChatGPT search uses Bing, Gemini/AI Overviews use Google, and Perplexity uses its own crawler plus search engines.
- [ ] **Answer real questions plainly.** The guides are written as direct answers with FAQs. (monthly) Add 2–4 new guides on questions you hear from salon owners, for example:
  - "How do I start a salon business in Kenya?"
  - "How to price braids by length"
  - "Salon hygiene checklist"
  - "How to run a barbershop with chair rental"
  - "Best way to take deposits for lash appointments"
  - "How to choose a salon location"
- [ ] **Keep facts consistent:** price, trial length, M-Pesa support and "no commission" should read the same on the site, directories and social bios.
- [ ] **Earn mentions:** honest participation in salon, beauty and small-business communities (Reddit, Facebook groups, WhatsApp communities, Kenyan beauty associations), guest posts, podcasts and press. Don't spam: communities ban it and AI systems learn from what real people say.
- [ ] **Case studies:** once a salon has used Darling for a month, publish a short story (with permission): what changed in no-shows, time saved on DMs, takings visibility.
- [ ] (monthly) **Ask the assistants yourself:** "best salon booking software in Kenya", "salon software with M-Pesa", "how to reduce no-shows at my salon". Note whether Darling appears and what they say, and fix gaps in the guides or listings.

## 9. Measurement (once, then monthly)

- [ ] **Vercel → Analytics:** enable Web Analytics (privacy-friendly) to see visits and top pages.
- [ ] Track AI referrals: visits from `chatgpt.com`, `perplexity.ai`, `copilot.microsoft.com`, `gemini.google.com`, `claude.ai` show up as referrers.
- [ ] Track signups → trials → paid conversions in **Admin → Overview**, and founding-offer places used.
- [ ] (monthly) Search Console + Bing: impressions, clicks, top queries, pages not indexed.

## 10. Monthly routine

- [ ] Publish 2–4 guides and run `npm run indexnow -- https://darlinghq.co.ke`.
- [ ] Update the `updated` date on any guide you revise.
- [ ] Post 8–12 short videos (reel engine + real salon clips).
- [ ] Ask 3–5 happy salons for a review on Capterra/G2/Trustpilot/Google.
- [ ] Check Search Console, Bing and AI-assistant answers for Darling.
