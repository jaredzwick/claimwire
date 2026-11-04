#!/usr/bin/env bun
// Generate the 3 how-it-works spot illustrations by calling OpenAI gpt-image-1.
// The hero image is already approved as variant-C from the design review and is
// copied in by hand (committed under public/img/hero.png). This script only
// produces the three step illustrations referenced in app/page.tsx.
//
// Idempotent: skips any file that already exists. Regenerate by deleting the
// target file and running `bun run scripts/generate-images.ts`.
//
// Env: OPENAI_API_KEY must be set. Reads from the repo-root `.env` (one dir up
// from claimwire/) via a 3-line parser — no `dotenv` dep.

import { promises as fs } from "node:fs";
import path from "node:path";

const STYLE_PREAMBLE =
  "Flat vector editorial illustration in the Stripe Press / 1970s Bell Labs technical manual style. " +
  "Palette: #0b0d10 background, #7cf5c4 mint accent, #4ea8ff electric blue, one #f0a06e warm orange highlight. " +
  "Geometric, confident shapes. No faces, no hands, no text, no cutesy curves, no 3D glass blobs, no AI glow.";

const IMAGES: { slug: string; prompt: string }[] = [
  {
    slug: "step-mint",
    prompt:
      "A short-lived credential being minted: a single stylized paper ticket being handed off, with a visible expiration clock face in the lower right. The ticket is subtly glowing mint along its edge. Keep the composition quiet and centered.",
  },
  {
    slug: "step-chain",
    prompt:
      "A chain of three wax-sealed credential tokens connected by signed cords, each visibly smaller than the previous one to communicate narrowing permissions. The leftmost is largest with a full wax seal, the next smaller, the third smallest. The seals glow warm orange.",
  },
  {
    slug: "step-verify",
    prompt:
      "A small stamping machine stamping an incoming credential envelope locally, with a modest trust-bundle filing cabinet beside it. The scene is self-contained — no network cables or wires leaving the frame — to communicate verification without calling home.",
  },
];

const PUBLIC_DIR = path.resolve(import.meta.dir, "..", "public", "img");

async function loadApiKey(): Promise<string> {
  const envVar = process.env.OPENAI_API_KEY;
  if (envVar) return envVar;

  const repoRootEnv = path.resolve(import.meta.dir, "..", "..", ".env");
  const text = await fs.readFile(repoRootEnv, "utf8").catch(() => "");
  for (const line of text.split("\n")) {
    const m = /^OPENAI_API_KEY=(.+)$/.exec(line.trim());
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  throw new Error(
    "OPENAI_API_KEY not found in env or in repo-root .env — set it and retry",
  );
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function generateOne(
  apiKey: string,
  slug: string,
  prompt: string,
): Promise<void> {
  const outPath = path.join(PUBLIC_DIR, `${slug}.png`);
  if (await fileExists(outPath)) {
    console.log(`[skip] ${slug}.png already exists`);
    return;
  }

  const fullPrompt = `${STYLE_PREAMBLE}\n\n${prompt}`;
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: fullPrompt,
      size: "1024x1024",
      quality: "high",
      n: 1,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${slug}: HTTP ${res.status} ${errText.slice(0, 400)}`);
  }

  const json = (await res.json()) as {
    data?: { b64_json?: string }[];
  };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error(`${slug}: no b64_json in response`);

  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await fs.writeFile(outPath, Buffer.from(b64, "base64"));
  console.log(`[ok]   wrote ${slug}.png`);
}

async function main() {
  const apiKey = await loadApiKey();
  await fs.mkdir(PUBLIC_DIR, { recursive: true });

  // Run in parallel — three API calls, each ~15–30s.
  const results = await Promise.allSettled(
    IMAGES.map((img) => generateOne(apiKey, img.slug, img.prompt)),
  );
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length) {
    for (const r of failed) {
      if (r.status === "rejected") console.error(`[fail] ${r.reason}`);
    }
    process.exit(1);
  }
  console.log("all images ready");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
