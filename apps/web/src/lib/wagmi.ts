import { defineChain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia, hardhat } from "wagmi/chains";

export const robinhoodMainnet = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" },
  },
});

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://robinhood-sepolia-rpc.publicnode.com", "https://rpc.testnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://explorer.testnet.chain.robinhood.com" },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: "Kradl — App & Project Launchpad",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "2a5321176b3021abefa996cecb5339bf",
  chains: [robinhoodTestnet, robinhoodMainnet, baseSepolia, base, hardhat],
  ssr: true,
});
