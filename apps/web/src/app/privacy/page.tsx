import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Kradl",
  description: "Privacy Policy for the Kradl non-custodial EVM app & project launchpad.",
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
      <div className="border-b border-[var(--border-subtle)] pb-5">
        <h1 className="font-display font-bold text-3xl text-white">Privacy Policy</h1>
        <p className="font-mono text-xs text-[var(--text-muted)] mt-2">
          Last updated: November 21, 2026
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">1. Data We Store</h2>
        <p>
          Kradl does not require email registration, passwords, or government ID to use the
          platform. We store:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Public on-chain events indexed from supported blockchains (token addresses, wallet
            addresses, trade volumes, vesting locks, and transaction hashes).
          </li>
          <li>
            User-submitted off-chain showcase metadata (project names, descriptions, logo URLs,
            live app/GitHub/X links, builder changelogs, wallet-signed comments, and optional
            referral bindings).
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">
          2. Authentication Cookies &amp; Local Storage
        </h2>
        <p>
          When you Sign In With Ethereum (SIWE), Kradl issues a single{" "}
          <span className="font-mono text-white">HttpOnly</span>,{" "}
          <span className="font-mono text-white">SameSite=Lax</span> session cookie to authenticate
          off-chain actions (editing your app showcase, publishing changelogs, commenting, or
          binding a referral). Browser local storage is used strictly to remember your Terms
          acknowledgement and pending referral parameter. We do not use third-party advertising
          trackers or sell user data.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">
          3. Third-Party Infrastructure Providers
        </h2>
        <p>
          To operate reliably and securely, technical request metadata (such as IP addresses and
          RPC calls) may be processed by our core infrastructure providers under their respective
          privacy policies:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="text-white">Cloudflare:</strong> DDoS mitigation, TLS termination,
            and edge caching.
          </li>
          <li>
            <strong className="text-white">Reown / WalletConnect:</strong> Optional mobile wallet QR
            and deep-link session relay.
          </li>
          <li>
            <strong className="text-white">Blockchain RPC Providers:</strong> PublicNode, Robinhood
            Chain, and Base RPC endpoints used to read chain state and broadcast signed
            transactions.
          </li>
        </ul>
        <p>
          In addition, Kradl temporarily holds hashed/in-memory IP rate-limit counters (max 60
          seconds) to prevent spam and abuse; IP addresses are not persisted to our database.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">
          4. Public Blockchain Permanence
        </h2>
        <p>
          All on-chain transactions are permanently recorded on public blockchains (such as
          Robinhood Chain and Base) and cannot be altered, hidden, or deleted by Kradl.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">
          5. Off-Chain Data Requests &amp; Contact
        </h2>
        <p>
          To request removal of off-chain showcase metadata or ask privacy questions, contact{" "}
          <a href="mailto:kradlxyz@gmail.com" className="font-mono text-white underline">
            kradlxyz@gmail.com
          </a>{" "}
          with proof of wallet ownership where applicable.
        </p>
      </section>
    </article>
  );
}
