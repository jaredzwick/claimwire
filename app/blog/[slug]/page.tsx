import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllSlugs, getPostBySlug } from "@/lib/posts";
import { SITE_URL, SITE_NAME, AUTHOR_NAME } from "@/lib/site";

type Params = { slug: string };

// Pre-render every post as static HTML at build time. New posts land on main;
// `next build` picks them up without any list to update.
export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found" };

  const url = `${SITE_URL}/blog/${post.slug}`;
  const ogImage = `${url}/opengraph-image`;

  return {
    title: `${post.title} — ${SITE_NAME}`,
    description: post.summary,
    alternates: { canonical: url },
    authors: [{ name: post.author }],
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      url,
      siteName: SITE_NAME,
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: [ogImage],
    },
  };
}

export default async function PostPage(
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;

  // schema.org Article — gives Google + LLM crawlers the structured version
  // of the post facts (headline, author, dates, URL). Served inline so the
  // page is still fully static.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: `${url}/opengraph-image`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen">
        <div className="mx-auto max-w-[720px] px-6 py-16 sm:py-24">
          <nav className="mb-10 flex items-center justify-between">
            <Link
              href="/"
              className="mono text-sm tracking-[0.2em] text-[var(--muted)] underline-offset-4 hover:underline"
            >
              ← CLAIMWIRE
            </Link>
            <Link
              href="/blog"
              className="text-[14px] text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
            >
              All writing
            </Link>
          </nav>

          <article>
            <header className="mb-10">
              <time
                dateTime={post.date}
                className="mono text-[13px] tracking-[0.15em] text-[var(--muted)]"
              >
                {formatDate(post.date)}
              </time>
              <h1 className="mt-4 font-display text-[36px] leading-[1.05] font-[550] sm:text-[56px]">
                {post.title}
              </h1>
              {post.summary && (
                <p className="mt-6 text-[20px] leading-[1.5] text-[var(--muted)]">
                  {post.summary}
                </p>
              )}
              <p className="mt-6 text-[14px] text-[var(--muted)]">
                By {post.author}
              </p>
            </header>

            <div className="prose-claimwire">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.body}
              </ReactMarkdown>
            </div>

            <aside className="mt-20 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
              <p className="font-display text-[20px] leading-[1.2] font-[500]">
                Running production AI agents?
              </p>
              <p className="mt-3 text-[15px] leading-[1.6] text-[var(--muted)]">
                If any of this landed, we run a $10k agent-identity pulse
                check — 10-page diagnostic + 2-hour debrief. Reply with
                &ldquo;audit&rdquo; and we&rsquo;ll send the template so you
                can run it yourself first.
              </p>
              <div className="mt-5">
                <Link
                  href="/#waitlist"
                  className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent)] px-5 py-3 text-[15px] font-[550] text-[#0b0d10] transition hover:opacity-90"
                >
                  Request a pulse check →
                </Link>
              </div>
            </aside>
          </article>
        </div>
      </main>
    </>
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
