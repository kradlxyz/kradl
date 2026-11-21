import React from "react";

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
      <div className="border-b border-[var(--border-subtle)] pb-5">
        <h1 className="font-display font-bold text-3xl text-white">Privacy Policy</h1>
        <p className="font-mono text-xs text-[var(--text-muted)] mt-2">
          Last updated: November 20, 2026
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">1. Data We Store</h2>
        <p>
          Kradl indexes public blockchain events (token addresses, wallet addresses, trade volumes,
          and transaction hashes) alongside user-submitted project showcase metadata (project
          descriptions, URLs, changelogs, and wallet-signed comments).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">2. Authentication Cookies</h2>
        <p>
          When you sign in with Ethereum (SIWE), Kradl stores a single HttpOnly session cookie to
          verify your wallet identity for off-chain actions (editing your app showcase, posting
          changelogs, or commenting). We do not use third-party ad trackers or sell user data.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">3. Public Blockchain Notice</h2>
        <p>
          All on-chain transactions are permanently recorded on public blockchains (such as
          Robinhood Chain and Base) and cannot be deleted or modified by Kradl.
        </p>
      </section>
    </article>
  );
}
