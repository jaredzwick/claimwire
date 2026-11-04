// Shared-secret trust header for SSR fetches to the backend API.
// Set API_TRUST_SECRET on both ends to authenticate server-to-server calls;
// leave unset in dev or when the backend doesn't require it.
export const API_TRUST_HEADER: HeadersInit = process.env.API_TRUST_SECRET
  ? { "X-Api-Trust": process.env.API_TRUST_SECRET }
  : {};
