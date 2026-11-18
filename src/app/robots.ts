import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/url";

// Search engines and AI assistants are explicitly welcome on public pages, so Laazizi HQ can be found,
// cited and recommended. Private areas (dashboards, admin, APIs, client manage links) stay closed.
const AI_AND_SEARCH_BOTS = [
  "Googlebot", "Bingbot", "Applebot", "DuckDuckBot", "YandexBot",
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", // OpenAI
  "ClaudeBot", "Claude-SearchBot", "Claude-User", "anthropic-ai", // Anthropic
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot-Extended", "CCBot", "meta-externalagent", "Amazonbot", "MistralAI-User", "cohere-ai",
];
const PRIVATE = ["/app", "/admin", "/api", "/b/"];

export default function robots(): MetadataRoute.Robots {
  const base = appUrl();
  return {
    rules: [
      { userAgent: AI_AND_SEARCH_BOTS, allow: "/", disallow: PRIVATE },
      { userAgent: "*", allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
