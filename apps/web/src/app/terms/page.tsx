import React from "react";

export default function TermsPage() {
  return (
    <article className="max-w-3xl space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
      <div className="border-b border-[var(--border-subtle)] pb-5">
        <h1 className="font-display font-bold text-3xl text-white">Terms of Use</h1>
        <p className="font-mono text-xs text-[var(--text-muted)] mt-2">
          Last updated: November 20, 2026
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">1. Non-Custodial Software</h2>
        <p>
          Kradl provides a web interface to interact with autonomous, open-source EVM smart
          contracts. Kradl never takes custody of user private keys, ETH, or ERC-20 tokens. All
          launches, buys, sells, and fee claims execute directly on public blockchains via your
          connected wallet.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">
          2. No Investment Advice or Guarantees
        </h2>
        <p>
          Nothing on Kradl constitutes financial, legal, or investment advice. Tokens deployed
          through Kradl are created by independent third-party builders. A &ldquo;Verified&rdquo;
          badge indicates only that a project supplied valid live URL and GitHub repository links;
          it is not an endorsement, financial audit, or guarantee of future value.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">3. Protocol Fees</h2>
        <p>
          Bonding-curve trades incur a 1.0% on-chain fee split evenly between the project builder
          (0.5%) and the Kradl protocol treasury (0.5%). Graduated curves incur a 2.0% graduation
          fee deducted prior to DEX liquidity migration. Gas fees are paid directly to the
          underlying blockchain network.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">4. Assumption of Risk</h2>
        <p>
          Smart contracts, RPC providers, and digital assets carry inherent technical and market
          risks. By using Kradl, you accept full responsibility for your wallet security,
          transactions, and compliance with applicable laws in your jurisdiction.
        </p>
      </section>
    </article>
  );
}
