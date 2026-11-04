import Image from "next/image";
import WaitlistForm from "./WaitlistForm";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[720px] px-6 py-16 sm:py-24">
        {/* 1. Hero */}
        <section aria-labelledby="hero-heading">
          <div className="mb-10 flex items-center gap-3">
            <div
              className="h-7 w-7 rounded-sm"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent) 0%, #4ea8ff 100%)",
              }}
              aria-hidden="true"
            />
            <span className="mono text-sm tracking-[0.2em] text-[var(--muted)]">
              CLAIMWIRE
            </span>
          </div>

          <h1
            id="hero-heading"
            className="font-display text-[36px] leading-[1.05] font-[550] sm:text-[56px]"
          >
            Give every AI agent a secure, scoped identity.
          </h1>

          <p className="mt-6 text-[17px] leading-[1.6] text-[var(--muted)]">
            No more hard-coded API keys. No more &ldquo;who did that?&rdquo;
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a
              href="#waitlist"
              className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent)] px-5 py-3 text-[15px] font-[550] text-[#0b0d10] transition hover:opacity-90"
            >
              Request early access →
            </a>
            <a
              href="#how"
              className="text-[15px] text-[var(--fg)] underline-offset-4 hover:underline"
            >
              See how it works
            </a>
          </div>

          <figure className="motion-fade-up mt-12">
            <Image
              src="/img/hero.png"
              alt="A central wax-sealed credential envelope connected to six hexagonal agent plaques by signed-handoff lines"
              width={1536}
              height={1024}
              priority
              className="h-auto w-full"
            />
          </figure>
        </section>

        {/* 2. Why we're building this */}
        <section
          aria-labelledby="why-heading"
          className="mt-24 border-t border-[var(--border)] pt-16"
        >
          <h2
            id="why-heading"
            className="font-display text-[26px] leading-[1.15] font-[500] sm:text-[36px]"
          >
            Why we&rsquo;re building this
          </h2>

          <ul className="mt-8 space-y-6 text-[17px] leading-[1.6]">
            <li>
              Static API keys live forever. Agents don&rsquo;t need them to.
            </li>
            <li>
              When an agent spawns a helper, nothing stops the helper from
              doing more than the parent could.
            </li>
          </ul>

          <blockquote className="mt-12 font-display text-[26px] leading-[1.25] text-[var(--muted)] sm:text-[36px]">
            &ldquo;logs show the key that was used &mdash; not{" "}
            <span className="text-[var(--accent)]">which agent</span> used it,
            on whose behalf.&rdquo;
          </blockquote>
        </section>

        {/* 3. How it works */}
        <section
          id="how"
          aria-labelledby="how-heading"
          className="mt-24 border-t border-[var(--border)] pt-16 scroll-mt-16"
        >
          <h2
            id="how-heading"
            className="font-display text-[26px] leading-[1.15] font-[500] sm:text-[36px]"
          >
            How it works
          </h2>

          <ol className="mt-10 space-y-14">
            <HowStep
              n={1}
              title="Mint a short-lived credential"
              body="Your agent asks claimwire for a credential scoped to exactly the resource and action it needs. It expires in minutes."
              img="/img/step-mint.png"
              alt="A paper credential ticket with an expiration clock face, being handed off"
            />
            <HowStep
              n={2}
              title="Delegate down the chain"
              body="When your agent spawns a sub-agent, the sub-agent can only receive permissions your agent already holds. The handoff is signed, not forwarded blindly."
              img="/img/step-chain.png"
              alt="Three wax-sealed credential tokens connected by signed cords, each smaller than the last"
            />
            <HowStep
              n={3}
              title="Verify at the resource"
              body="The server receiving the request checks the signature against a trust bundle it caches locally. No callback to a central auth hub — your service stays up even if we're down."
              img="/img/step-verify.png"
              alt="A stamping machine stamping an incoming credential envelope locally, next to a small trust-bundle filing cabinet"
            />
          </ol>
        </section>

        {/* 4. Built on open standards (verbatim founder pitch) */}
        <section
          aria-labelledby="standards-heading"
          className="mt-24 border-t border-[var(--border)] pt-16"
        >
          <h2
            id="standards-heading"
            className="font-display text-[26px] leading-[1.15] font-[500] sm:text-[36px]"
          >
            Built on open standards
          </h2>

          <div className="mt-8 space-y-6 text-[17px] leading-[1.6]">
            <p>
              We issue short-lived, scoped credentials bound to a workload or
              agent identity, using{" "}
              <span className="mono text-[var(--accent)]">SPIFFE/WIMSE</span>{" "}
              primitives and{" "}
              <span className="mono text-[var(--accent)]">
                OAuth token exchange
              </span>{" "}
              for delegation chains.
            </p>
            <p>
              It supports <em>attenuated delegation</em> — a sub-agent can only
              receive permissions its orchestrator already holds — and carries
              the full on-behalf-of chain in every token so that any downstream
              system can answer:{" "}
              <span className="italic text-[var(--muted)]">
                which agent did this, acting on whose authority, with what
                permissions?
              </span>
            </p>
            <p>
              Descope&rsquo;s Agentic Identity Hub and ZeroID are early moves
              in this direction, but they are still fundamentally identity
              providers with an agent-shaped feature. The inversion is to make
              the claim self-verifying at the resource, not dependent on the
              hub being reachable.
            </p>
          </div>
        </section>

        {/* 5. Waitlist form */}
        <section
          id="waitlist"
          aria-labelledby="waitlist-heading"
          className="mt-24 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 scroll-mt-16 sm:p-8"
        >
          <h2
            id="waitlist-heading"
            className="font-display text-[22px] leading-[1.2] font-[500] sm:text-[28px]"
          >
            Join the design-partner cohort
          </h2>
          <p className="mt-3 text-[15px] leading-[1.6] text-[var(--muted)]">
            We&rsquo;re onboarding a small group of early design partners. If
            you&rsquo;re shipping agents into production this quarter, tell us
            what you&rsquo;re building — we&rsquo;ll be in touch within a week.
          </p>
          <div className="mt-6">
            <WaitlistForm />
          </div>
        </section>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 text-[13px] text-[var(--muted)]">
          <span>
            No marketing list. We only email the people we&rsquo;re actually
            working with.
          </span>
          <a
            href="/blog"
            className="underline-offset-4 hover:text-[var(--fg)] hover:underline"
          >
            Writing →
          </a>
        </footer>
      </div>
    </main>
  );
}

function HowStep({
  n,
  title,
  body,
  img,
  alt,
}: {
  n: number;
  title: string;
  body: string;
  img: string;
  alt: string;
}) {
  return (
    <li className="grid gap-6 sm:grid-cols-[1fr_200px] sm:items-start sm:gap-10">
      <div>
        <span className="mono text-[13px] tracking-[0.2em] text-[var(--muted)]">
          STEP 0{n}
        </span>
        <h3 className="mt-2 font-display text-[22px] leading-[1.2] font-[500]">
          {title}
        </h3>
        <p className="mt-3 text-[17px] leading-[1.6] text-[var(--fg)]">
          {body}
        </p>
      </div>
      <Image
        src={img}
        alt={alt}
        width={400}
        height={400}
        className="h-auto w-full rounded-md border border-[var(--border)]"
      />
    </li>
  );
}
