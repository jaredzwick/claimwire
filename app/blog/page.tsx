import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Writing — ${SITE_NAME}`,
  description:
    "Notes on agent identity, short-lived credentials, SPIFFE/WIMSE in production, and the on-behalf-of problem.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: `Writing — ${SITE_NAME}`,
    description:
      "Notes on agent identity, short-lived credentials, SPIFFE/WIMSE in production, and the on-behalf-of problem.",
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Writing — ${SITE_NAME}`,
  },
};

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[720px] px-6 py-16 sm:py-24">
        <nav className="mb-10">
          <Link
            href="/"
            className="mono text-sm tracking-[0.2em] text-[var(--muted)] underline-offset-4 hover:underline"
          >
            ← CLAIMWIRE
          </Link>
        </nav>

        <h1 className="font-display text-[36px] leading-[1.05] font-[550] sm:text-[56px]">
          Writing
        </h1>
        <p className="mt-6 text-[17px] leading-[1.6] text-[var(--muted)]">
          Notes on agent identity, short-lived credentials, and the parts of
          SPIFFE/WIMSE that actually matter in production.
        </p>

        <ul className="mt-16 divide-y divide-[var(--border)]">
          {posts.map((post) => (
            <li key={post.slug} className="py-8">
              <Link href={`/blog/${post.slug}`} className="group block">
                <time
                  dateTime={post.date}
                  className="mono text-[13px] tracking-[0.15em] text-[var(--muted)]"
                >
                  {formatDate(post.date)}
                </time>
                <h2 className="mt-3 font-display text-[26px] leading-[1.15] font-[500] text-[var(--fg)] group-hover:text-[var(--accent)] sm:text-[32px]">
                  {post.title}
                </h2>
                {post.summary && (
                  <p className="mt-3 text-[17px] leading-[1.6] text-[var(--muted)]">
                    {post.summary}
                  </p>
                )}
              </Link>
            </li>
          ))}
          {posts.length === 0 && (
            <li className="py-8 text-[var(--muted)]">
              No posts yet. Check back soon.
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
