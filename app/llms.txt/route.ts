// llms.txt — markdown summary for AI crawlers that look for it (coding
// agents mostly; the research chapter notes that no major answer-engine
// crawler documents reading it, so we don't bank on citation lift). Cheap
// to publish, zero rendering cost. Served as text/plain at /llms.txt.

import { getAllPosts } from "@/lib/posts";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const posts = await getAllPosts();

  const body = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Writing",
    "",
    ...posts.map(
      (p) =>
        `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.summary || ""}`.trim(),
    ),
    "",
    "## Key links",
    "",
    `- [Home](${SITE_URL}/)`,
    `- [Writing index](${SITE_URL}/blog)`,
    `- [Request a pulse check](${SITE_URL}/#waitlist)`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
