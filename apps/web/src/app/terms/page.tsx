import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use · Kradl",
  description: "Terms of Use for the Kradl non-custodial EVM app & project launchpad interface.",
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
      <div className="border-b border-[var(--border-subtle)] pb-5">
        <h1 className="font-display font-bold text-3xl text-white">Terms of Use</h1>
        <p className="font-mono text-xs text-[var(--text-muted)] mt-2">
          Last updated: November 21, 2026
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">
          1. Non-Custodial Software Interface
        </h2>
        <p>
          Kradl (<span className="font-mono text-white">https://kradl.xyz</span>) provides a web
          interface to interact with autonomous, open-source EVM smart contracts (including{" "}
          <span className="font-mono text-white">KradlLaunchpad</span>,{" "}
          <span className="font-mono text-white">KradlVestingVault</span>, and{" "}
          <span className="font-mono text-white">KradlMerkleDistributor</span>). Kradl never takes
          custody of user private keys, ETH, or ERC-20 tokens. All token launches, buys, sells,
          vesting locks, and claims execute directly on public blockchains via your connected
          wallet.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">
          2. Eligibility &amp; Restricted Jurisdictions
        </h2>
        <p>
          You must be at least 18 years old (or the age of legal majority in your jurisdiction) to
          use Kradl. You represent that you are not located in, organized in, or a resident of any
          jurisdiction subject to comprehensive international sanctions (including OFAC, UN, or EU
          sanctions lists), and that you will not use Kradl for money laundering, fraud, phishing,
          or any unlawful activity.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">
          3. No Investment Advice or Endorsements
        </h2>
        <p>
          Nothing on Kradl constitutes financial, legal, tax, or investment advice. Tokens deployed
          through Kradl are created by independent third-party builders. Badges such as{" "}
          <span className="font-mono text-white">Verified Builder</span> or{" "}
          <span className="font-mono text-white">Creator Locked</span> indicate only automated
          checks of submitted URLs or on-chain vesting vault balances; they are not endorsements,
          security audits, or guarantees of future value, liquidity, or project delivery.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">4. Protocol Fees</h2>
        <p>
          Bonding-curve trades incur a 1.0% on-chain fee split evenly between the project builder
          (0.5% claimable in ETH) and the Kradl protocol treasury (0.5%). Graduated curves incur a
          2.0% graduation fee deducted prior to automated DEX liquidity migration and permanent LP
          burn. Network gas fees are paid directly to the underlying blockchain validators.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">
          5. Season Rewards, Points &amp; Airdrops
        </h2>
        <p>
          Points displayed on the Kradl Rewards portal represent off-chain accounting of verified
          on-chain activity and carry no direct monetary value or guaranteed redemption rate. Kradl
          reserves the right to adjust point formulas, modify campaign timelines, or disqualify
          wallets engaged in wash trading, Sybil farming, or automated abuse prior to any Merkle
          airdrop snapshot.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">
          6. Off-Chain Content &amp; Interface Moderation
        </h2>
        <p>
          While underlying smart contracts are permissionless and immutable on public blockchains,
          Kradl reserves the right to hide, delist, or remove off-chain metadata (project
          descriptions, images, external links, changelogs, or comments) from the web interface if
          it contains malware, phishing links, copyright infringement, hate speech, or unlawful
          material.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">
          7. Assumption of Risk &amp; Limitation of Liability
        </h2>
        <p>
          Kradl is provided strictly on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo; basis
          without warranties of any kind. Smart contracts, RPC providers, DEX routers, and digital
          assets carry inherent technical and market risks, including total loss of funds. To the
          maximum extent permitted by applicable law, Kradl and its contributors shall not be liable
          for any indirect, incidental, or consequential damages arising from your use of the
          interface or smart contracts.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg text-white">8. Contact</h2>
        <p>
          Questions regarding these Terms or takedown notices may be sent to{" "}
          <a href="mailto:kradlxyz@gmail.com" className="font-mono text-white underline">
            kradlxyz@gmail.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
