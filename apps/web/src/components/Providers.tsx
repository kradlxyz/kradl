"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useAccount, useChainId, useSignMessage } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "@/lib/wagmi";

interface AuthContextValue {
  sessionAddress: string | null;
  isAuthenticated: boolean;
  isSigningIn: boolean;
  authError: string | null;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  sessionAddress: null,
  isAuthenticated: false,
  isSigningIn: false,
  authError: null,
  signIn: async () => false,
  signOut: async () => {},
});

export function useKradlAuth() {
  return useContext(AuthContext);
}

function SiweAuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  const [sessionAddress, setSessionAddress] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Capture ?ref=0x... from URL so invited users are credited automatically on sign-in
    if (typeof window !== "undefined") {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref && /^0x[a-fA-F0-9]{40}$/.test(ref)) {
        window.localStorage.setItem("kradl_pending_ref", ref.toLowerCase());
      }
    }

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.address) {
          setSessionAddress(data.address);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sessionAddress || typeof window === "undefined") return;
    const pendingRef = window.localStorage.getItem("kradl_pending_ref");
    if (!pendingRef || pendingRef === sessionAddress.toLowerCase()) return;
    fetch("/api/rewards/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrerAddress: pendingRef }),
    })
      .then(() => {
        window.localStorage.removeItem("kradl_pending_ref");
      })
      .catch(() => {});
  }, [sessionAddress]);

  const signIn = useCallback(async () => {
    if (!address || !isConnected) return false;
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const nonceRes = await fetch("/api/auth/nonce");
      if (!nonceRes.ok) {
        setAuthError("Could not request sign-in nonce.");
        return false;
      }
      const { nonce } = await nonceRes.json();
      if (!nonce) {
        setAuthError("Empty nonce received.");
        return false;
      }

      const domain = window.location.host;
      const message = [
        `${domain} wants you to sign in with your Ethereum account:`,
        address,
        "",
        "Sign in to Kradl to manage your launched apps, post builder updates, and join discussions.",
        "",
        `Chain ID: ${chainId}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join("\n");

      const signature = await signMessageAsync({ account: address, message });
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message, signature }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        setAuthError(errData.error || `Verification failed (${verifyRes.status})`);
        return false;
      }
      const verified = await verifyRes.json();
      setSessionAddress(verified.address);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAuthError(
        msg.includes("rejected") || msg.includes("denied")
          ? "Signature rejected in wallet."
          : msg.slice(0, 140)
      );
      return false;
    } finally {
      setIsSigningIn(false);
    }
  }, [address, isConnected, chainId, signMessageAsync]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setSessionAddress(null);
    setAuthError(null);
  }, []);

  const isAuthenticated =
    Boolean(sessionAddress) &&
    Boolean(address) &&
    sessionAddress?.toLowerCase() === address?.toLowerCase();

  return (
    <AuthContext.Provider
      value={{ sessionAddress, isAuthenticated, isSigningIn, authError, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#FAFAFA",
            accentColorForeground: "#09090B",
            borderRadius: "medium",
            overlayBlur: "none",
          })}
        >
          <SiweAuthProvider>{children}</SiweAuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
