import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/posts";

// 1200x630 is the Twitter/LinkedIn/OG spec dimension. Edge-rendered on demand
// via next/og (satori); no files to maintain, every post gets a tailored image
// at request time.

// nodejs runtime — the post loader uses node:fs, which edge can't do.
// Rendering stays cheap because ImageResponse (satori) is pure JS.
export const alt = "Claimwire — writing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  const title = post?.title ?? "Claimwire";
  const summary = post?.summary ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0b0d10",
          color: "#e8ecef",
          padding: "80px 72px",
        }}
      >
        {/* eyebrow / brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #7cf5c4 0%, #4ea8ff 100%)",
              borderRadius: 6,
            }}
          />
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 22,
              letterSpacing: "0.3em",
              color: "#8a93a0",
            }}
          >
            CLAIMWIRE
          </div>
        </div>

        {/* headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: title.length > 60 ? 56 : 72,
              lineHeight: 1.05,
              fontWeight: 600,
              color: "#e8ecef",
              display: "flex",
            }}
          >
            {title}
          </div>
          {summary && (
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.4,
                color: "#8a93a0",
                display: "flex",
              }}
            >
              {summary.length > 180 ? summary.slice(0, 177) + "…" : summary}
            </div>
          )}
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 20,
            color: "#8a93a0",
            borderTop: "1px solid #1a1f26",
            paddingTop: 24,
          }}
        >
          <span>Secure, scoped identity for AI agents.</span>
          <span style={{ fontFamily: "monospace" }}>claimwire</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
