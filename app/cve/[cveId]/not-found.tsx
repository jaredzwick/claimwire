import Link from "next/link";

export default function CVENotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-[var(--fg)]">CVE not found</h1>
      <p className="mt-4 text-[var(--muted)]">
        We don&rsquo;t have this CVE in our database yet. New entries land
        within minutes of NVD publication; the record may still be propagating,
        or NVD may have rejected it.
      </p>
      <Link
        href="/cve"
        className="mt-6 inline-block rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
      >
        Browse the CVE database
      </Link>
    </main>
  );
}
