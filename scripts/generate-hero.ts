#!/usr/bin/env bun
// Generate ONLY the hero illustration. Separate from generate-images.ts
// because the hero went through its own design-review approval loop and the
// prompt here is tuned specifically to prevent gpt-image-1 from baking the
// headline / sub / CTA copy into the image (which it did on the first pass).
//
// Idempotent: skips if public/img/hero.png exists. To regenerate, delete
// hero.png first.

import { promises as fs } from "node:fs";
import path from "node:path";

const PROMPT = `
Flat vector editorial illustration on a FULLY TRANSPARENT BACKGROUND
(alpha channel). Shapes rendered in a muted editorial palette: mint-teal
#7cf5c4, electric blue #4ea8ff, deep navy #1a2332 for depth, and a single
warm orange #f0a06e highlight on a central wax seal. Style reference:
Stripe Press book covers crossed with 1970s Bell Labs technical manual
illustrations. Geometric, confident, flat vector shapes with subtle grain.

Subject: a single stylized credential envelope at the EXACT CENTER of the
frame — a wax-sealed envelope crossed with a modern hardware security key.
The wax seal is warm orange. The envelope body uses mint-teal and electric
blue. Around the envelope, radiating outward on faint signed-handoff lines,
are six small flat hexagonal plaques (NOT human silhouettes, NOT people) —
each hexagon is a solid muted-blue tile representing an abstract agent.
Composition is quiet, centered, symmetrical, and confident.

HARD CONSTRAINTS — the image MUST have:
- Transparent (alpha=0) background. NO white, cream, gray or any solid
  rectangular background behind the illustration.
- NO text, letters, words, logotype, headline, subheading, button, CTA,
  tagline, labels, numbers, or captions anywhere in the image.
- NO rendered mock UI, fake webpage, fake app screen, or CTA button graphic.
- NO human silhouettes, faces, hands, or figures. The agents are flat
  HEXAGONAL plaques only.
- NO 3D glass blobs, neon glow, holographic effects, radial halos, drop
  shadows, or AI "glow" aesthetics. Flat, graphic, editorial.
`;

async function loadApiKey(): Promise<string> {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const envText = await fs
    .readFile(path.resolve(import.meta.dir, "..", "..", ".env"), "utf8")
    .catch(() => "");
  for (const line of envText.split("\n")) {
    const m = /^OPENAI_API_KEY=(.+)$/.exec(line.trim());
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  throw new Error("OPENAI_API_KEY not found");
}

async function main() {
  const outPath = path.resolve(import.meta.dir, "..", "public", "img", "hero.png");
  try {
    await fs.access(outPath);
    console.log(`[skip] ${outPath} already exists (delete it to regenerate)`);
    return;
  } catch {
    /* not present → generate */
  }

  const apiKey = await loadApiKey();
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: PROMPT,
      size: "1536x1024",
      quality: "high",
      background: "transparent",
      n: 1,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err.slice(0, 400)}`);
  }

  const json = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("no b64_json in response");

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, Buffer.from(b64, "base64"));
  console.log(`[ok] wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
