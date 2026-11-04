"use client";

import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Status = "idle" | "submitting" | "ok" | "error";
type FieldErrors = Partial<Record<"email" | "name" | "role", string>>;

const ROLES = [
  "Platform / infra engineer",
  "Security / IAM engineer",
  "Founder / CTO",
  "Agent / AI product builder",
  "Other",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);
    const payload = {
      full_name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      role: String(data.get("role") ?? "").trim(),
      pain: String(data.get("pain") ?? "").trim(),
      ref_source: "claimwire-landing",
    };

    // Client-side validation. Server validates again; this is UX.
    const errs: FieldErrors = {};
    if (!payload.full_name) errs.name = "Enter your name.";
    if (!payload.email) errs.email = "Enter your work email.";
    else if (!EMAIL_RE.test(payload.email))
      errs.email = "Enter a valid work email.";
    if (!payload.role) errs.role = "Pick the role that best fits.";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setStatus("submitting");

    try {
      const res = await fetch(`${API_URL}/claimwire/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong — try again.",
      );
    }
  }

  if (status === "ok") {
    return (
      <div
        role="status"
        className="rounded-md border border-[var(--accent)]/50 bg-[var(--accent)]/10 p-5"
      >
        <div className="font-display text-[20px] leading-[1.2] font-[500] text-[var(--accent)]">
          You&rsquo;re on the list.
        </div>
        <p className="mt-2 text-[15px] leading-[1.5] text-[var(--fg)]">
          We&rsquo;ll reach out within a week if we think you&rsquo;re a fit
          for the design-partner cohort.
        </p>
      </div>
    );
  }

  const busy = status === "submitting";

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Name"
          name="name"
          required
          error={fieldErrors.name}
          disabled={busy}
        />
        <Field
          label="Work email"
          name="email"
          type="email"
          required
          error={fieldErrors.email}
          disabled={busy}
        />
      </div>
      <Field label="Company" name="company" disabled={busy} />
      <label className="grid gap-1 text-[14px]">
        <span className="text-[var(--muted)]">Role</span>
        <select
          name="role"
          defaultValue=""
          required
          disabled={busy}
          aria-invalid={fieldErrors.role ? true : undefined}
          className="min-h-[44px] rounded-md border border-[var(--border)] bg-black/30 px-3 py-2 text-[var(--fg)] outline-none focus:border-[var(--accent)] disabled:opacity-60"
        >
          <option value="" disabled>
            Select one…
          </option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {fieldErrors.role && (
          <span className="text-[13px] text-[#ff7a7a]">{fieldErrors.role}</span>
        )}
      </label>
      <label className="grid gap-1 text-[14px]">
        <span className="text-[var(--muted)]">
          What&rsquo;s the identity problem you&rsquo;re trying to solve?{" "}
          <span className="opacity-60">(optional)</span>
        </span>
        <textarea
          name="pain"
          rows={4}
          disabled={busy}
          placeholder="Agents calling other agents, static API keys everywhere, Entra single-tenant lock-in, something else…"
          className="resize-y rounded-md border border-[var(--border)] bg-black/30 px-3 py-2 text-[var(--fg)] outline-none placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] disabled:opacity-60"
        />
      </label>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-900/60 bg-red-900/20 p-3 text-[14px] text-red-200"
        >
          Something went wrong — {error}. Try again.
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-md bg-[var(--accent)] px-5 py-3 text-[15px] font-[550] text-[#0b0d10] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Submitting…" : "Request early access →"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  error,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1 text-[14px]">
      <span className="text-[var(--muted)]">
        {label}
        {required ? "" : <span className="ml-1 opacity-60">(optional)</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        className="min-h-[44px] rounded-md border border-[var(--border)] bg-black/30 px-3 py-2 text-[var(--fg)] outline-none focus:border-[var(--accent)] disabled:opacity-60"
      />
      {error && (
        <span className="text-[13px] text-[#ff7a7a]">{error}</span>
      )}
    </label>
  );
}
