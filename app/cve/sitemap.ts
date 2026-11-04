import type { MetadataRoute } from "next";
import { API_TRUST_HEADER } from "@/lib/api-trust";

// CVE sitemap. Chunked per the SEO research guidance (sitemaps <10k URLs each).
// For v0 we emit a tiny seed list of KEV + top-EPSS CVEs via a dedicated
// backend endpoint; follow-up extends this to the full indexable corpus
// via `generateSitemaps` (Next 15+ sharding API) once the ingest cron has
// a steady-state corpus.
//
// The endpoint is lazy: if the backend is unreachable or returns [], the
// sitemap is empty — safer than throwing a build error.

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type SitemapRow = { cve_id: string; last_modified_at?: string };

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let rows: SitemapRow[] = [];
  try {
    // v0: a lightweight public endpoint returning the warm set (KEV + top
    // 100 EPSS). Follow-up PR adds pagination for the full indexable set.
    const res = await fetch(`${API_URL}/cve/_sitemap`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json", ...API_TRUST_HEADER },
    });
    if (res.ok) {
      rows = (await res.json()) as SitemapRow[];
    }
  } catch {
    // Fail soft: empty sitemap is better than a crashed build.
  }

  return rows.map((r) => ({
    url: `https://claimwire.com/cve/${r.cve_id.toUpperCase()}`,
    lastModified: r.last_modified_at ? new Date(r.last_modified_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
}
