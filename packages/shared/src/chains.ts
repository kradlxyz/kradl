export interface KradlChainConfig {
  id: number;
  name: string;
  shortName: string;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  explorerUrl: string;
  badgeColor: string;
}

export const KRADL_CHAINS: Record<number, KradlChainConfig> = {
  4663: {
    id: 4663,
    name: "Robinhood Chain",
    shortName: "Robinhood",
    isTestnet: false,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://robinhood-rpc.publicnode.com",
    explorerUrl: "https://robinhoodchain.blockscout.com",
    badgeColor: "#00E5A0",
  },
  46630: {
    id: 46630,
    name: "Robinhood Chain Testnet",
    shortName: "RH Testnet",
    isTestnet: true,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://robinhood-sepolia-rpc.publicnode.com",
    explorerUrl: "https://explorer.testnet.chain.robinhood.com",
    badgeColor: "#00E5A0",
  },
  8453: {
    id: 8453,
    name: "Base",
    shortName: "Base",
    isTestnet: false,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    badgeColor: "#38BDF8",
  },
  84532: {
    id: 84532,
    name: "Base Sepolia",
    shortName: "Base Sepolia",
    isTestnet: true,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    badgeColor: "#38BDF8",
  },
  31337: {
    id: 31337,
    name: "Hardhat Local",
    shortName: "Localhost",
    isTestnet: true,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "http://127.0.0.1:8545",
    explorerUrl: "",
    badgeColor: "#94A3B8",
  },
};

export const SUPPORTED_CHAIN_IDS = Object.keys(KRADL_CHAINS).map(Number);

export function getChainConfig(chainId: number): KradlChainConfig | undefined {
  return KRADL_CHAINS[chainId];
}

export function getTxExplorerUrl(chainId: number, txHash: string): string | null {
  const chain = KRADL_CHAINS[chainId];
  if (!chain || !chain.explorerUrl) return null;
  return `${chain.explorerUrl}/tx/${txHash}`;
}

export function getAddressExplorerUrl(chainId: number, address: string): string | null {
  const chain = KRADL_CHAINS[chainId];
  if (!chain || !chain.explorerUrl) return null;
  return `${chain.explorerUrl}/address/${address}`;
}
