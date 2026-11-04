import type { MetadataRoute } from "next";

// Explicit allow for the three bot classes per the SEO + LLM-citation
// research (ever-just.github.io/discoverability, attensira.com guides):
//   1. Index crawlers — Googlebot, Bingbot
//   2. AI search-index — OAI-SearchBot, PerplexityBot, Claude-SearchBot
//   3. On-demand fetchers — ChatGPT-User, Claude-User, Perplexity-User
//   4. Training crawlers — GPTBot, ClaudeBot, Google-Extended, CCBot
//
// Explicit Allow lines are defensive — a future accidental Disallow in
// another branch of this file would at least leave these intact for the
// bots that matter.
export default function robots(): MetadataRoute.Robots {
  const host = "https://claimwire.com";
  const common = { allow: "/" };
  return {
    rules: [
      // Default
      { userAgent: "*", ...common },
      // Google
      { userAgent: "Googlebot", ...common },
      { userAgent: "Google-Extended", ...common },
      // Microsoft
      { userAgent: "Bingbot", ...common },
      // OpenAI
      { userAgent: "GPTBot", ...common },
      { userAgent: "OAI-SearchBot", ...common },
      { userAgent: "ChatGPT-User", ...common },
      // Anthropic
      { userAgent: "ClaudeBot", ...common },
      { userAgent: "Claude-SearchBot", ...common },
      { userAgent: "Claude-User", ...common },
      // Perplexity
      { userAgent: "PerplexityBot", ...common },
      { userAgent: "Perplexity-User", ...common },
      // Open-corpus
      { userAgent: "CCBot", ...common },
      // Apple
      { userAgent: "Applebot", ...common },
      { userAgent: "Applebot-Extended", ...common },
    ],
    sitemap: [`${host}/sitemap.xml`, `${host}/cve/sitemap.xml`],
    host,
  };
}
