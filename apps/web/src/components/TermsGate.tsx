"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "kradl_terms_accepted_v1";

export function TermsGate() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (pathname === "/terms" || pathname === "/privacy") {
      setVisible(false);
      return;
    }
    try {
      const accepted = window.localStorage.getItem(STORAGE_KEY);
      if (!accepted) {
        setVisible(true);
      }
    } catch {
      // ignore storage errors
    }
  }, [pathname]);

  function handleAccept() {
    if (!checked) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kradl-terms-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
    >
      <div className="w-full max-w-md rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] p-6 space-y-4">
        <h2 id="kradl-terms-title" className="font-display font-bold text-xl text-white">
          Protocol Notice &amp; Terms of Use
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Kradl is a non-custodial interface for deploying and trading bonding-curve tokens on EVM
          networks. Kradl does not hold user funds, guarantee project outcomes, or provide financial
          advice. Token prices are volatile and you may lose the full value of any purchase.
        </p>

        <label className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 accent-white cursor-pointer"
          />
          <span>
            I have read and agree to the{" "}
            <Link href="/terms" className="text-white underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-white underline">
              Privacy Policy
            </Link>
            , and understand the risks of on-chain trading.
          </span>
        </label>

        <button
          onClick={handleAccept}
          disabled={!checked}
          className="w-full py-2.5 rounded-md text-sm font-semibold bg-[var(--accent-primary)] text-[var(--accent-ink)] hover:brightness-95 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue to Kradl
        </button>
      </div>
    </div>
  );
}
