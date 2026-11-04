import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchCVE, severityColor, primaryVendorProduct } from "@/lib/cve-api";
import type { CVEDetail } from "@/lib/cve-api";

// ISR: regenerate at most once per hour; on-demand revalidation fires from
// the backend when new narrative is written (via a webhook revalidate hook
// — follow-up). Pre-build KEV + top-100 EPSS at deploy for warm start
// (handled in generateStaticParams below).
export const revalidate = 3600;
export const dynamicParams = true;

// Pre-render the hottest subset so first bots to hit a CVE page get HTML
// instantly rather than cold-render. Follow-up: query the backend
// /cve/_warm-set endpoint for the real list; for now, ship empty = ISR
// generates on-demand on first fetch per CVE.
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ cveId: string }> };

// ────────────────────────────────────────────────────────────────────────
// Metadata (CTR-tuned per the SEO research)
// Title pattern: ${CVE-ID} — ${severity} ${score} in ${vendor} ${product} [KEV]
// Meta: 2 branches — if KEV, lead with exploit; else lead with severity + patch
// ────────────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: Props,
): Promise<Metadata> {
  const { cveId } = await params;
  const r = await fetchCVE(cveId);
  if (r.status !== "ok") {
    return {
      title: `${cveId.toUpperCase()} not found | Claimwire`,
      robots: { index: false },
    };
  }
  const d = r.data;
  const vp = primaryVendorProduct(d);
  const scoreTag = d.cvss_score != null ? ` ${d.cvss_score.toFixed(1)}` : "";
  const sev = d.severity ?? "Unscored";
  const kevTag = d.is_kev ? " [KEV]" : "";
  const title = `${d.cve_id} — ${sev}${scoreTag}${vp ? ` in ${vp}` : ""}${kevTag}`;
  const description = buildMetaDescription(d);
  const canonical = `https://claimwire.com/cve/${d.cve_id}`;

  return {
    title: `${title} | Claimwire`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      publishedTime: d.published_at,
      modifiedTime: d.last_modified_at,
      siteName: "Claimwire",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

function buildMetaDescription(d: CVEDetail): string {
  const parts: string[] = [];
  if (d.is_kev) {
    parts.push("Actively exploited (CISA KEV).");
  } else if (d.severity) {
    parts.push(`${d.severity} vulnerability.`);
  }
  const patch = d.references?.some((r) => (r.tags ?? []).includes("Patch"));
  parts.push(patch ? "Patch available." : "No patch tagged yet.");
  const incidentCount = d.incidents?.length ?? 0;
  if (incidentCount > 0) parts.push(`${incidentCount} confirmed incident${incidentCount === 1 ? "" : "s"}.`);
  if (d.ai?.tldr) {
    const tldr = d.ai.tldr.length > 90 ? d.ai.tldr.slice(0, 87) + "…" : d.ai.tldr;
    parts.push(tldr);
  } else if (d.description) {
    const desc = d.description.length > 90 ? d.description.slice(0, 87) + "…" : d.description;
    parts.push(desc);
  }
  const out = parts.join(" ");
  return out.length > 160 ? out.slice(0, 157) + "…" : out;
}

// ────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────
export default async function CVEPage({ params }: Props) {
  const { cveId } = await params;
  const r = await fetchCVE(cveId);
  if (r.status === "not_found" || r.status === "gone") notFound();
  if (r.status === "error") {
    throw new Error(r.detail);
  }
  const d = r.data;
  const vp = primaryVendorProduct(d);
  const sevColor = severityColor(d.severity);
  const canonical = `https://claimwire.com/cve/${d.cve_id}`;

  // Structured data: TechArticle + BreadcrumbList + FAQPage.
  // schema.org has no native Vulnerability type; we embed identifiers via
  // mainEntityOfPage. Rich-result eligibility: TechArticle gets article
  // snippet; FAQPage still eligible for cybersecurity queries per 2026 docs.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: `${d.cve_id} — ${d.severity ?? "Unscored"} vulnerability${vp ? ` in ${vp}` : ""}`,
      description: d.description?.slice(0, 500),
      datePublished: d.published_at,
      dateModified: d.last_modified_at,
      author: { "@type": "Organization", name: "Claimwire Research" },
      publisher: {
        "@type": "Organization",
        name: "Claimwire",
        url: "https://claimwire.com",
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      identifier: d.cve_id,
      about: d.cwes?.map((c) => ({
        "@type": "Thing",
        identifier: c.id,
        name: c.name ?? c.id,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "CVE database", item: "https://claimwire.com/cve" },
        { "@type": "ListItem", position: 2, name: d.cve_id, item: canonical },
      ],
    },
    buildFAQSchema(d),
  ].filter(Boolean);

  return (
    <article className="mx-auto max-w-4xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--muted)]">
        <Link href="/cve" className="hover:text-[var(--accent)]">CVE database</Link>
        <span className="mx-2">›</span>
        <span>{d.cve_id}</span>
      </nav>

      {/* Hero */}
      <header className="mb-10">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
              <span className="mono">{d.cve_id}</span>
              {vp && <span className="text-[var(--muted)]"> — {vp}</span>}
            </h1>
            {d.ai?.tldr ? (
              <p className="mt-4 text-lg text-[var(--fg)]">{d.ai.tldr}</p>
            ) : d.description ? (
              <p className="mt-4 text-lg text-[var(--fg)]">
                {d.description.length > 300 ? d.description.slice(0, 297) + "…" : d.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {d.cvss_score != null && (
              <div
                className="rounded-md px-3 py-2 text-center text-black font-semibold"
                style={{ background: sevColor, minWidth: 110 }}
              >
                <div className="text-xs opacity-90 uppercase tracking-widest">
                  CVSS v{d.cvss_version ?? "?"}
                </div>
                <div className="text-2xl leading-none mt-0.5">{d.cvss_score.toFixed(1)}</div>
                <div className="text-xs uppercase mt-0.5">{d.severity ?? "N/A"}</div>
              </div>
            )}
            {d.is_kev && (
              <div className="rounded-md border border-red-600 bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-200">
                CISA KEV {d.kev_added_at ? `· ${new Date(d.kev_added_at).toISOString().slice(0, 10)}` : ""}
                {d.kev_ransomware && " · ransomware"}
              </div>
            )}
          </div>
        </div>

        {/* Facts strip */}
        <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Fact label="Published" value={d.published_at ? new Date(d.published_at).toISOString().slice(0, 10) : "—"} />
          <Fact
            label="EPSS"
            value={
              d.epss_score != null
                ? `${(d.epss_score * 100).toFixed(1)}%${d.epss_percentile != null ? ` · p${(d.epss_percentile * 100).toFixed(0)}` : ""}`
                : "—"
            }
          />
          <Fact label="Exploits" value={(d.references?.filter((r) => (r.tags ?? []).includes("Exploit")).length ?? 0).toString()} />
          <Fact
            label="Fix available"
            value={d.references?.some((r) => (r.tags ?? []).includes("Patch")) ? "Yes" : "Not tagged"}
          />
        </dl>
      </header>

      {/* Am I affected? */}
      {(d.ai?.affected_summary || (d.affected_products && d.affected_products.length > 0)) && (
        <Section id="am-i-affected" title="Am I affected?">
          {d.ai?.affected_summary && (
            <p className="mb-4 text-[var(--fg)]">{d.ai.affected_summary}</p>
          )}
          {d.affected_products && d.affected_products.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-[var(--border)] text-sm">
                <thead>
                  <tr className="bg-[var(--card)] text-left">
                    <th className="px-3 py-2 font-medium">Vendor</th>
                    <th className="px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 font-medium">Affected versions</th>
                  </tr>
                </thead>
                <tbody>
                  {d.affected_products.slice(0, 50).map((p, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2 mono">{p.vendor ?? "—"}</td>
                      <td className="px-3 py-2 mono">{p.product ?? "—"}</td>
                      <td className="px-3 py-2 text-[var(--muted)]">{versionRange(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {d.affected_products.length > 50 && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {d.affected_products.length - 50} additional affected products omitted.
                </p>
              )}
            </div>
          )}
        </Section>
      )}

      {/* The patch */}
      {d.ai?.patch_summary && (
        <Section id="the-patch" title="The patch">
          <p className="text-[var(--fg)]">{d.ai.patch_summary}</p>
        </Section>
      )}

      {/* Detection */}
      {d.ai?.detection_hint && (
        <Section id="detection" title="Detection">
          <p className="text-[var(--fg)] whitespace-pre-wrap">{d.ai.detection_hint}</p>
        </Section>
      )}

      {/* In the news / incidents */}
      {d.incidents && d.incidents.length > 0 && (
        <Section id="incidents" title="In the news">
          <ul className="space-y-4">
            {d.incidents.map((inc, i) => (
              <li key={i} className="rounded-md border border-[var(--border)] p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <a
                      href={inc.source_url}
                      className="font-medium text-[var(--fg)] hover:text-[var(--accent)]"
                      rel="noopener"
                    >
                      {inc.title || inc.source_url}
                    </a>
                    {inc.summary && <p className="mt-1 text-sm text-[var(--muted)]">{inc.summary}</p>}
                  </div>
                  <div className="text-right text-xs text-[var(--muted)] shrink-0">
                    {inc.affected_org && <div className="font-medium text-[var(--fg)]">{inc.affected_org}</div>}
                    {inc.source_domain && <div className="mono">{inc.source_domain}</div>}
                    {inc.occurred_at && <div>{new Date(inc.occurred_at).toISOString().slice(0, 10)}</div>}
                    <div className="mt-1 flex gap-1.5 justify-end">
                      <span className="rounded border border-[var(--border)] px-1.5 py-0.5 capitalize">{inc.kind.replace(/_/g, " ")}</span>
                      {inc.confidence && (
                        <span
                          className="rounded px-1.5 py-0.5 text-black"
                          style={{ background: inc.confidence === "high" ? "#7cf5c4" : inc.confidence === "medium" ? "#f5c47c" : "#64748b" }}
                        >
                          {inc.confidence}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Remediation */}
      {d.ai?.remediation_steps && (
        <Section id="remediation" title="Remediation">
          <div className="prose prose-invert whitespace-pre-wrap text-[var(--fg)]">
            {d.ai.remediation_steps}
          </div>
        </Section>
      )}

      {/* CWEs */}
      {d.cwes && d.cwes.length > 0 && (
        <Section id="weaknesses" title="Weakness classification">
          <ul className="flex flex-wrap gap-2">
            {d.cwes.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm mono"
              >
                {c.id}
                {c.name && <span className="ml-2 text-[var(--muted)]">{c.name}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* References */}
      {d.references && d.references.length > 0 && (
        <Section id="references" title="References">
          <ul className="space-y-2">
            {d.references.slice(0, 30).map((r, i) => (
              <li key={i} className="text-sm">
                <a
                  href={r.url}
                  className="text-[var(--accent)] hover:underline break-all"
                  rel="noopener"
                >
                  {r.url}
                </a>
                {r.tags && r.tags.length > 0 && (
                  <span className="ml-2 text-xs text-[var(--muted)]">
                    [{r.tags.join(", ")}]
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Related CVE links (vendor hubs — stubbed for now, real page is Phase 2) */}
      {d.vendors && d.vendors.length > 0 && (
        <Section id="related" title="Related">
          <p className="text-sm text-[var(--muted)]">
            More CVEs for{" "}
            {d.vendors.slice(0, 5).map((v, i) => (
              <span key={v}>
                {i > 0 && ", "}
                <Link href={`/cve/vendor/${encodeURIComponent(v)}`} className="text-[var(--accent)] hover:underline mono">
                  {v}
                </Link>
              </span>
            ))}
          </p>
        </Section>
      )}

      {/* Data provenance footer */}
      <footer className="mt-16 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)]">
        <p>
          Sourced from{" "}
          <a href="https://nvd.nist.gov/" rel="noopener" className="hover:text-[var(--accent)]">
            NVD
          </a>
          {d.is_kev && (
            <>
              {" + "}
              <a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" rel="noopener" className="hover:text-[var(--accent)]">
                CISA KEV
              </a>
            </>
          )}
          {d.epss_score != null && (
            <>
              {" + "}
              <a href="https://www.first.org/epss/" rel="noopener" className="hover:text-[var(--accent)]">
                FIRST EPSS
              </a>
            </>
          )}
          {d.ai && (
            <>
              {" + AI synthesis ("}
              {d.ai.model ?? "Claude"}
              {d.ai.generated_at && `, ${new Date(d.ai.generated_at).toISOString().slice(0, 10)}`}
              {")"}
            </>
          )}
          .{" "}
          Last modified: {d.last_modified_at ? new Date(d.last_modified_at).toISOString().slice(0, 16).replace("T", " ") + " UTC" : "—"}.
        </p>
      </footer>

      {/* Business funnel */}
      <aside className="mt-12 rounded-lg border border-[var(--accent)]/40 bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold text-[var(--fg)]">
          Building AI agents that need scoped, auditable credentials?
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Claimwire is a portable identity layer for agent workloads — short-lived credentials,
          attenuated delegation, OBO chains that answer <em>"which agent did this, on whose authority?"</em>
        </p>
        <Link
          href="/#waitlist"
          className="mt-4 inline-block rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black hover:opacity-90"
        >
          Join the design-partner waitlist →
        </Link>
      </aside>
    </article>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-16">
      <h2 className="mb-4 text-xl font-semibold text-[var(--fg)]">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] p-3">
      <dt className="text-xs uppercase tracking-widest text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-base font-medium text-[var(--fg)]">{value}</dd>
    </div>
  );
}

function versionRange(p: {
  version_start_including?: string;
  version_start_excluding?: string;
  version_end_including?: string;
  version_end_excluding?: string;
}): string {
  const start = p.version_start_including
    ? `≥ ${p.version_start_including}`
    : p.version_start_excluding
    ? `> ${p.version_start_excluding}`
    : "any";
  const end = p.version_end_including
    ? `≤ ${p.version_end_including}`
    : p.version_end_excluding
    ? `< ${p.version_end_excluding}`
    : "any";
  if (start === "any" && end === "any") return "all versions";
  return `${start}, ${end}`;
}

function buildFAQSchema(d: CVEDetail): object | null {
  const questions: { q: string; a: string }[] = [];
  if (d.ai?.affected_summary) {
    questions.push({ q: `Am I affected by ${d.cve_id}?`, a: d.ai.affected_summary });
  }
  if (d.ai?.patch_summary) {
    questions.push({ q: `What does the patch for ${d.cve_id} fix?`, a: d.ai.patch_summary });
  }
  if (d.ai?.detection_hint) {
    questions.push({ q: `How do I detect ${d.cve_id}?`, a: d.ai.detection_hint });
  }
  if (questions.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a },
    })),
  };
}
