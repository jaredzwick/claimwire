// Minimal blog-post loader: reads markdown files from content/blog/, parses
// YAML-style frontmatter (title, slug, author, date, summary), and returns
// typed records. No dependencies — Next 16 server components call these at
// build time so the raw fs reads never ship to the client.

import { promises as fs } from "node:fs";
import path from "node:path";

export type Post = {
  slug: string;
  title: string;
  author: string;
  date: string;
  summary: string;
  body: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  // Expect first line === "---". Scan until the next "---" line, then everything
  // after is body. Minimal YAML scalar parser: `key: value`, strip wrapping quotes.
  const lines = raw.split("\n");
  if (lines[0]?.trim() !== "---") {
    return { meta: {}, body: raw };
  }
  const meta: Record<string, string> = {};
  let i = 1;
  for (; i < lines.length; i++) {
    if (lines[i].trim() === "---") break;
    const m = /^([a-zA-Z0-9_-]+):\s*(.*)$/.exec(lines[i]);
    if (m) meta[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  const body = lines.slice(i + 1).join("\n").trim();
  return { meta, body };
}

async function readPostFile(filePath: string): Promise<Post> {
  const raw = await fs.readFile(filePath, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const fileSlug = path.basename(filePath, ".md");
  return {
    slug: meta.slug || fileSlug,
    title: meta.title || fileSlug,
    author: meta.author || "Jared Zwick",
    date: meta.date || "",
    summary: meta.summary || "",
    body,
  };
}

export async function getAllPosts(): Promise<Post[]> {
  const entries = await fs.readdir(BLOG_DIR).catch(() => []);
  const posts = await Promise.all(
    entries
      .filter((f) => f.endsWith(".md"))
      .map((f) => readPostFile(path.join(BLOG_DIR, f))),
  );
  // Newest first.
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getAllSlugs(): Promise<string[]> {
  const posts = await getAllPosts();
  return posts.map((p) => p.slug);
}
