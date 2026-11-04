// Canonical origin for metadata, OG images, sitemap, llms.txt. Overridable
// per deploy via NEXT_PUBLIC_SITE_URL — Vercel preview URLs set it per PR;
// production can point at the real brand domain once we have one.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://claimwire.com"
).replace(/\/$/, "");

export const SITE_NAME = "Claimwire";

export const SITE_DESCRIPTION =
  "Short-lived, scoped identity credentials for AI agents. SPIFFE/WIMSE primitives, OAuth token exchange, attenuated delegation — with the full on-behalf-of chain in every token.";

export const AUTHOR_NAME = "Jared Zwick";
